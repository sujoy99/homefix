import { Transaction } from "objection";
import { getRefreshTokenExpiryDate } from "./auth.jwt";
import { RefreshToken } from "./refresh_token.model";


export class RefreshTokenService {
  static async storeToken(data: {
    tokenId: string;
    userId: string;
    authAccountId: string;
    deviceId?: string;
    refreshTokenVersion: string;
    ipAddress?: string;
    userAgent?: string,
  }, trx?: Transaction) {

    return RefreshToken.query(trx).insert({
      id: data.tokenId,
      user_id: data.userId,
      auth_account_id: data.authAccountId,
      device_id: data.deviceId ?? null,
      refresh_token_version: data.refreshTokenVersion,
      expires_at: getRefreshTokenExpiryDate()
    });
  }

  static async findToken(tokenId: string) {
    return RefreshToken.query()
    .findById(tokenId)
    .withGraphFetched('[user, authAccount]')
    .modifyGraph('user', (builder) => {
      builder.select('id', 'mobile', 'role', 'status');
    })
    .modifyGraph('authAccount', (builder) => {
      builder.select('id', 'refresh_token_version');
    });;
  }

  static async revokeToken(tokenId: string, trx?: Transaction) {
    return RefreshToken.query(trx)
      .patch({ is_revoked: true })
      .where('id', tokenId);
  }
}