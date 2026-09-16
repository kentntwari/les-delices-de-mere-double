import { Prisma, PrismaClient } from "@prisma/client";
import { db as dbClient } from "@repo/db";
import { ApplicationError, NotFoundError } from "../errors.appwide";
import { DatabaseError } from "../errors.db";
import { OrderCommentTransformer } from "../transformers/comment";

export type OrderCommentModel = Prisma.OrderCommentGetPayload<{
  omit: {
    source: true;
  };
}> & {
  user_name: string | null;
  source_id: string | null;
};

export interface IDbOrderComment extends Prisma.OrderCommentGetPayload<{
  include: {
    user: {
      select: {
        name: true;
      };
    };
  };
}> {}

export class OrderCommentRepository {
  constructor(private db: PrismaClient = dbClient) {}

  async getById(
    orderId: string,
    commentId: string,
  ): Promise<OrderCommentModel | null> {
    try {
      const model = await this.db.orderComment.findFirst({
        where: {
          id: { equals: commentId, mode: "insensitive" },
          orderId: { equals: orderId, mode: "insensitive" },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return model ? OrderCommentTransformer.toModel(model) : null;
    } catch (error) {
      throw new DatabaseError("Failed to get order comment from database", {
        operation: "repository.comment.getById",
        orderId,
        commentId,
        error,
      });
    }
  }

  async getComments(orderId: string): Promise<OrderCommentModel[]> {
    try {
      const raw: IDbOrderComment[] = await this.db.orderComment.findMany({
        where: { orderId: { equals: orderId, mode: "insensitive" } },
        orderBy: { createdAt: "asc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return raw.map(OrderCommentTransformer.toModel);
    } catch (error) {
      throw new DatabaseError("Failed to get order comments from database", {
        operation: "repository.comment.getComments",
        orderId,
        error,
      });
    }
  }

  async createComment(
    orderId: string,
    userId: string,
    comment: string,
    metadata?: {
      sourceId?: string | null;
      taggedUserIds?: string[];
    },
  ): Promise<OrderCommentModel> {
    try {
      const model = await this.db.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT id
          FROM orders
          WHERE LOWER(id) = LOWER(${orderId})
          FOR UPDATE
        `;

        const commentsCount = await tx.orderComment.count({
          where: {
            orderId: {
              equals: orderId,
              mode: "insensitive",
            },
          },
        });

        if (commentsCount >= 10) {
          throw new ApplicationError(
            "Comment limit reached for this order. Only 10 comments are allowed.",
            {
              operation: "repository.comment.createComment",
              orderId,
              userId,
              commentsCount,
            },
            "repository.comment.createComment",
          );
        }

        if (metadata?.sourceId) {
          const sourceComment = await tx.orderComment.findFirst({
            where: {
              id: { equals: metadata.sourceId, mode: "insensitive" },
              orderId: { equals: orderId, mode: "insensitive" },
            },
            select: { id: true },
          });

          if (!sourceComment) {
            throw new NotFoundError("Reply source comment not found", {
              operation: "repository.comment.createComment",
              orderId,
              sourceId: metadata.sourceId,
            });
          }
        }

        const createdComment = await tx.orderComment.create({
          data: {
            comment,
            ...(metadata?.sourceId && { source: metadata.sourceId }),
            ...(metadata?.taggedUserIds && {
              taggedUserId: metadata.taggedUserIds,
            }),
            order: {
              connect: { id: orderId.toUpperCase() },
            },
            user: {
              connect: { id: userId },
            },
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        });

        if (metadata?.sourceId) {
          await tx.orderComment.update({
            where: { id: metadata.sourceId },
            data: {
              replies: {
                push: createdComment.id,
              },
            },
          });
        }

        return createdComment;
      });

      return OrderCommentTransformer.toModel(model);
    } catch (error) {
      if (error instanceof ApplicationError || error instanceof NotFoundError)
        throw error;

      throw new DatabaseError("Failed to create order comment in database", {
        operation: "repository.comment.createComment",
        orderId,
        error,
      });
    }
  }

  async getCommentSource(orderId: string, sourceId: string[]) {
    if (sourceId.length === 0) return [];

    try {
      return await this.db.orderComment.findMany({
        where: {
          id: { in: sourceId },
          orderId: { equals: orderId, mode: "insensitive" },
        },
        select: {
          id: true,
          comment: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to retrieve comment source", {
        operation: "repository.comment.getCommentSource",
        orderId,
        sourceId,
        error,
      });
    }
  }

  async getCommentTaggedUsers(
    orderId: string,
    commentId: string[],
    taggedUserIds: string[],
  ): Promise<
    {
      id: string;
      name: string;
      commentId: string;
    }[]
  > {
    if (commentId.length === 0 || taggedUserIds.length === 0) return [];

    try {
      const query = await this.db.orderComment.findMany({
        where: {
          id: { in: commentId },
          orderId: { equals: orderId, mode: "insensitive" },
          taggedUserId: { hasSome: taggedUserIds },
        },
        select: {
          id: true,
          taggedUserId: true,
        },
      });

      if (query.length === 0) return [];

      const resolvedTaggedUserIds = Array.from(
        new Set(query.flatMap((comment) => comment.taggedUserId)),
      );

      type TaggedUserRow = {
        id: string;
        name: string;
      };

      const users = await this.db.$queryRaw<TaggedUserRow[]>`
        SELECT id, name
        FROM "User"
        WHERE LOWER(id) IN (${Prisma.join(
          resolvedTaggedUserIds.map((id) => id.toLowerCase()),
        )})
      `;

      const usersMap = new Map(
        users.map((user) => [user.id.toLowerCase(), user] as const),
      );

      return query.flatMap((comment) =>
        comment.taggedUserId.flatMap((taggedUserId) => {
          const user = usersMap.get(taggedUserId.toLowerCase());

          if (!user) return [];

          return {
            id: user.id,
            name: user.name,
            commentId: comment.id,
          };
        }),
      );
    } catch (error) {
      throw new DatabaseError("Failed to retrieve comment tagged users", {
        operation: "repository.comment.getCommentTaggedUsers",
        orderId,
        commentId,
        taggedUserIds,
        error,
      });
    }
  }

  async likeComment(
    orderId: string,
    commentId: string,
    userId: string,
  ): Promise<OrderCommentModel> {
    try {
      const model = await this.db.$transaction(async (tx) => {
        const currentComment = await tx.orderComment.findFirst({
          where: {
            id: { equals: commentId, mode: "insensitive" },
            orderId: { equals: orderId, mode: "insensitive" },
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!currentComment)
          throw new NotFoundError("Comment not found", {
            operation: "repository.comment.likeComment",
            orderId,
            commentId,
          });

        if (
          currentComment.likedBy.some(
            (likedUserId) => likedUserId.toLowerCase() === userId.toLowerCase(),
          )
        ) {
          return currentComment;
        }

        return await tx.orderComment.update({
          where: { id: currentComment.id },
          data: {
            likedBy: {
              push: userId,
            },
            likedCount: {
              increment: 1,
            },
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        });
      });

      return OrderCommentTransformer.toModel(model);
    } catch (error) {
      if (error instanceof ApplicationError || error instanceof NotFoundError)
        throw error;

      throw new DatabaseError("Failed to like order comment in database", {
        operation: "repository.comment.likeComment",
        orderId,
        commentId,
        userId,
        error,
      });
    }
  }

  async deleteComment(orderId: string, commentId: string): Promise<void> {
    try {
      await this.db.$transaction(async (tx) => {
        const currentComment = await tx.orderComment.findFirst({
          where: {
            id: { equals: commentId, mode: "insensitive" },
            orderId: { equals: orderId, mode: "insensitive" },
          },
          select: {
            id: true,
            source: true,
          },
        });

        if (!currentComment) {
          throw new NotFoundError("Comment not found", {
            operation: "repository.comment.deleteComment",
            orderId,
            commentId,
          });
        }

        if (currentComment.source) {
          const parentComment = await tx.orderComment.findFirst({
            where: {
              id: { equals: currentComment.source, mode: "insensitive" },
              orderId: { equals: orderId, mode: "insensitive" },
            },
            select: {
              id: true,
              replies: true,
            },
          });

          if (parentComment) {
            await tx.orderComment.update({
              where: { id: parentComment.id },
              data: {
                replies: parentComment.replies.filter(
                  (replyId) =>
                    replyId.toLowerCase() !== currentComment.id.toLowerCase(),
                ),
              },
            });
          }
        }

        await tx.orderComment.delete({
          where: { id: currentComment.id },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;

      throw new DatabaseError("Failed to delete order comment from database", {
        operation: "repository.comment.deleteComment",
        orderId,
        commentId,
        error,
      });
    }
  }
}
