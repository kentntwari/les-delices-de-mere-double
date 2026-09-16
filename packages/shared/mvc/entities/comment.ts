import { UserEntity } from "./user";
import type { OrderCommentModel } from "../repository/comment";

interface IOrderCommentEntity extends Omit<
  OrderCommentModel,
  | "user_name"
  | "source_id"
  | "replies"
  | "likedBy"
  | "taggedUserId"
  | "likedCount"
  | "createdAt"
> {}

interface IOrderCommentOptions {
  user: UserEntity;
}

export class OrderCommentEntity implements IOrderCommentEntity {
  protected _userName: string | undefined;
  private _taggedUsers: string[] = [];
  private _likedCount: number = 0;
  private _sourceId: string | null = null;

  constructor(
    public readonly id: string,
    public readonly comment: string,
    public readonly orderId: string,
    public readonly userId: string | null,
    public readonly createdAt: string,
    private options: IOrderCommentOptions = {
      user: new UserEntity("", "", "", "", "USER"),
    },
  ) {}

  get userName(): string | undefined {
    return this._userName;
  }

  set userName(name: string) {
    this.options.user.fullName = name;
    this._userName = this.options.user.fullName;
  }

  get sourceId(): string | null {
    return this._sourceId;
  }

  set sourceId(id: string | null) {
    this._sourceId = id;
  }

  get likedCount(): number {
    return this._likedCount;
  }

  set likedCount(count: number) {
    this._likedCount = count;
  }

  get taggedUsers(): string[] {
    return this._taggedUsers;
  }

  set taggedUsers(users: UserEntity["id"][]) {
    this._taggedUsers = users;
  }
}
