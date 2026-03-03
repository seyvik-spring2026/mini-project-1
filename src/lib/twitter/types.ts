export interface TwitterUser {
  type: string;
  userName: string;
  url: string;
  id: string;
  name: string;
  isBlueVerified: boolean;
  profilePicture: string;
  coverPicture: string;
  description: string;
  location: string;
  followers: number;
  following: number;
  canDm: boolean;
  createdAt: string;
  favouritesCount: number;
  mediaCount: number;
  statusesCount: number;
  pinnedTweetIds: string[];
  isAutomated: boolean;
}

export interface TwitterTweet {
  type: string;
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  inReplyToId: string | null;
  conversationId: string;
  author: TwitterUser;
  entities: {
    hashtags: { text: string }[];
    urls: { display_url: string; expanded_url: string }[];
    user_mentions: { screen_name: string; name: string }[];
  };
  retweeted_tweet?: TwitterTweet | null;
  quoted_tweet?: TwitterTweet | null;
}

export interface TweetSearchResponse {
  tweets: TwitterTweet[];
  has_next_page: boolean;
  next_cursor: string;
}

export interface UserInfoResponse {
  data: TwitterUser;
  status: string;
  msg: string;
}

export interface UserSearchResponse {
  users: TwitterUser[];
  has_next_page: boolean;
  next_cursor: string;
}

export interface UserTweetsResponse {
  tweets: TwitterTweet[];
  has_next_page: boolean;
  next_cursor: string;
}
