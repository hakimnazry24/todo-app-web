/** Claims carried by the session JWT. */
export interface JwtPayload {
  /** User id. */
  sub: string;
  /** Session id — the row in `sessions` that this token belongs to. */
  sid: string;
  username: string;
}

/** What the JWT strategy attaches to `request.user`. */
export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  username: string;
}
