import type { IDbOrderComment, OrderCommentModel } from "../repository/comment";

export class OrderCommentTransformer {
  static toModel(data: IDbOrderComment): OrderCommentModel {
    return {
      id: data.id,
      source_id: data.source ?? null,
      comment: data.comment,
      createdAt: data.createdAt,
      orderId: data.orderId,
      userId: data.userId,
      user_name: data.user?.name ?? null,
      likedCount: data.likedCount,
      taggedUserId: data.taggedUserId,
      replies: data.replies,
      likedBy: data.likedBy,
    };
  }
}
