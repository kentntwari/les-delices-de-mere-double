import {
  createOrderCommentSchema,
  type TCreateOrderCommentSchema,
} from "../../shared/utils/schemas.zod";
import type { TOrderPreviewRepositoryModel } from "~~/shared/types";

import { BaseFactory } from "./base";
import { OrderCommentEntity } from "../entities/comment";
import { ApplicationError } from "../errors.appwide";
import type { OrderCommentModel } from "../repository/comment";

export class OrderCommentFactory extends BaseFactory<
  TCreateOrderCommentSchema,
  OrderCommentEntity
> {
  static fromOrderPreview(
    model: TOrderPreviewRepositoryModel,
    options?: {
      taggedUserId?: string[];
    },
  ): OrderCommentModel[] {
    return model.orderComments.map((comment) => ({
      id: comment.id,
      source_id: comment.source || null,
      orderId: model.id,
      userId: comment.user?.id || "UNKNOWN_USER_ID",
      user_name: comment.user?.name || "UNKNOWN_USER_NAME",
      comment: comment.comment,
      replies: [],
      likedBy: [],
      likedCount: comment.likedCount,
      taggedUserId: options?.taggedUserId || [],
      createdAt: comment.createdAt,
    }));
  }

  protected build(data: TCreateOrderCommentSchema): OrderCommentEntity {
    return new OrderCommentEntity(
      "PENDING_COMMENT_ID",
      data.comment,
      data.orderId,
      data.userId ?? null,
      data.createdAt,
    );
  }

  validate(data: unknown): TCreateOrderCommentSchema {
    try {
      const parsedData = createOrderCommentSchema.safeParse(data);
      if (parsedData.success) return parsedData.data;

      throw new ApplicationError("Validation failed", {
        issues: parsedData.error.issues,
        input: JSON.stringify(data),
        source: "mvc.factories.comment.OrderCommentFactory.validate",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;

      throw new ApplicationError(
        "Unknown error occurred during validation of create order comment",
        {
          originalError: error,
          input: data,
          source: "mvc.factories.comment.OrderCommentFactory.validate",
        },
      );
    }
  }
}
