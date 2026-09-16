import { BaseMapper } from "./base";
import { OrderCommentEntity } from "../entities/comment";
import { OrderCommentFactory } from "../factories/comment";
import type { OrderCommentModel } from "../repository/comment";

export type TOrderCommentDTO = Pick<
  OrderCommentEntity,
  "id" | "sourceId" | "comment" | "userName" | "likedCount" | "createdAt"
>;

type TTaggedUserId = string;
export type TOrderCommentDetailsDTO = {
  id: string;
  user_name: string | undefined;
  source_comment: string | null;
  comment: string;
  taggedUsers: TTaggedUserId[];
  likedCount: number;
  createdAt: string;
};

export class OrderCommentMapper extends BaseMapper<
  OrderCommentEntity,
  TOrderCommentDTO,
  OrderCommentModel
> {
  toEntity(data: OrderCommentModel): OrderCommentEntity {
    const entity = new OrderCommentEntity(
      data.id,
      data.comment,
      data.orderId,
      data.userId,
      data.createdAt.toISOString(),
    );

    entity.userName = data.user_name || "";
    entity.sourceId = data.source_id || null;
    entity.taggedUsers = data.taggedUserId;
    entity.likedCount = data.likedCount;

    return entity;
  }

  toEntityList(data: OrderCommentModel[]): OrderCommentEntity[] {
    return data.map((comment) => this.toEntity(comment));
  }

  toSafeModel(entity: OrderCommentEntity): Partial<OrderCommentModel> {
    return {
      id: entity.id,
      orderId: entity.orderId,
      userId: entity.userId,
      comment: entity.comment,
      user_name: entity.userName ?? null,
      source_id: entity.sourceId,
      taggedUserId: entity.taggedUsers,
      likedCount: entity.likedCount,
      createdAt: new Date(entity.createdAt),
    };
  }

  toDto(entity: OrderCommentEntity): TOrderCommentDTO {
    return {
      id: entity.id,
      comment: entity.comment,
      sourceId: entity.sourceId,
      userName: entity.userName,
      likedCount: entity.likedCount,
      createdAt: entity.createdAt,
    };
  }

  toDtoList(entities: OrderCommentEntity[]): TOrderCommentDTO[] {
    return entities.map((entity) => this.toDto(entity));
  }

  fromModel(model: OrderCommentModel): TOrderCommentDetailsDTO {
    return {
      id: model.id,
      comment: model.comment,
      source_comment: null,
      createdAt: model.createdAt.toISOString(),
      likedCount: model.likedCount,
      taggedUsers: [],
      user_name: model.user_name || undefined,
    };
  }

  fromModelList(models: OrderCommentModel[]): TOrderCommentDetailsDTO[] {
    return models.map((model) => this.fromModel(model));
  }
}

export { OrderCommentFactory };
