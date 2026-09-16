import { ApplicationError, NotFoundError } from "../errors.appwide";
import {
  OrderCommentMapper,
  type TOrderCommentDetailsDTO,
} from "../mapper/comment";
import { OrderCommentRepository } from "../repository/comment";
import { BaseService } from "./base";
import { OrderCommentFactory } from "../factories/comment";

export class OrderCommentService extends BaseService {
  constructor(
    private repository: OrderCommentRepository = new OrderCommentRepository(),
    private factory: OrderCommentFactory = new OrderCommentFactory(),
    private mapper: OrderCommentMapper = new OrderCommentMapper(),
  ) {
    super();
  }

  async list(orderId: string) {
    try {
      const model = await this.repository.getComments(orderId);
      return this.mapper.toEntityList(model);
    } catch (error) {
      this.defaultMapError(error, "service.comment.list");
      throw error;
    }
  }

  async listDetails(orderId: string): Promise<TOrderCommentDetailsDTO[]> {
    try {
      const model = await this.repository.getComments(orderId);
      const dto = this.mapper.fromModelList(model);

      const [sourceComment, taggedUsers] = await Promise.all([
        this.repository.getCommentSource(
          orderId,
          model
            .map((comment) => comment.source_id)
            .filter((commentId): commentId is string => commentId !== null),
        ),
        this.repository.getCommentTaggedUsers(
          orderId,
          model.map((comment) => comment.id),
          model.flatMap((comment) => comment.taggedUserId),
        ),
      ]);

      const sourceCommentById = new Map(
        sourceComment.map((comment) => [comment.id, comment.comment] as const),
      );

      const taggedUsersByCommentId = new Map<string, string[]>();

      for (const taggedUser of taggedUsers) {
        const current = taggedUsersByCommentId.get(taggedUser.commentId) ?? [];
        current.push(taggedUser.name);
        taggedUsersByCommentId.set(taggedUser.commentId, current);
      }

      return dto.map((commentDto, index) => {
        const sourceId = model[index]?.source_id;

        return {
          ...commentDto,
          source_comment:
            sourceId && sourceCommentById.has(sourceId)
              ? (sourceCommentById.get(sourceId) ?? commentDto.source_comment)
              : commentDto.source_comment,
          taggedUsers:
            taggedUsersByCommentId.get(commentDto.id) ?? commentDto.taggedUsers,
        };
      });
    } catch (error) {
      this.defaultMapError(error, "service.comment.listDetails");
      throw error;
    }
  }

  async create(orderId: string, userId: string, data: unknown) {
    try {
      const { comment, metadata } = this.factory.validate(data);

      const model = await this.repository.createComment(
        orderId,
        userId,
        comment,
        {
          sourceId: metadata?.sourceId ?? null,
          taggedUserIds: metadata?.tagged ?? [],
        },
      );

      return this.mapper.fromModel(model);
    } catch (error) {
      this.defaultMapError(error, "service.comment.create");
      throw error;
    }
  }

  async like(orderId: string, commentId: string, userId: string) {
    try {
      const model = await this.repository.likeComment(
        orderId,
        commentId,
        userId,
      );
      return this.mapper.fromModel(model);
    } catch (error) {
      this.defaultMapError(error, "service.comment.like");
      throw error;
    }
  }

  async delete(orderId: string, commentId: string, userId: string) {
    try {
      const comment = await this.repository.getById(orderId, commentId);

      if (!comment) {
        throw new NotFoundError("Comment not found", {
          operation: "service.comment.delete",
          orderId,
          commentId,
        });
      }

      if (
        !comment.userId ||
        comment.userId.toLowerCase() !== userId.toLowerCase()
      ) {
        throw new ApplicationError(
          "You are not allowed to delete this comment",
          {
            operation: "service.comment.delete",
            orderId,
            commentId,
            commentAuthorId: comment.userId,
            actingUserId: userId,
          },
        );
      }

      await this.repository.deleteComment(orderId, commentId);

      return { id: comment.id };
    } catch (error) {
      this.defaultMapError(error, "service.comment.delete");
      throw error;
    }
  }
}
