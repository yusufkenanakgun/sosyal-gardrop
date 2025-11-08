import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePostDto, PostVisibility } from './dto/create-post.dto';
import { NotificationsService, NotificationType, NotificationTargetType } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new post
   */
  async createPost(userId: string, dto: CreatePostDto) {
    // If outfitId is provided, verify it belongs to the user
    if (dto.outfitId) {
      const outfit = await this.prisma.outfit.findUnique({
        where: { id: dto.outfitId },
      });

      if (!outfit || outfit.userId !== userId) {
        throw new ForbiddenException('Outfit not found or does not belong to you');
      }
    }

    const post = await this.prisma.post.create({
      data: {
        userId,
        caption: dto.caption,
        mediaUrls: dto.mediaUrls || [],
        visibility: dto.visibility || PostVisibility.PUBLIC,
        outfitId: dto.outfitId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        outfit: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return this.formatPost(post, userId);
  }

  /**
   * Get feed for user (posts from followed users + own posts)
   */
  async getFeed(userId: string, cursor?: string, limit = 20) {
    // Get users that current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { userId: { in: [...followingIds, userId] } }, // Own posts + followed users
          { visibility: PostVisibility.PUBLIC }, // Public posts from everyone
        ],
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        outfit: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Check if user liked each post
    const postIds = posts.map((p) => p.id);
    const userLikes = await this.prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    // Check if user saved each post
    const userSaves = await this.prisma.savedPost.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    const likedPostIds = new Set(userLikes.map((l) => l.postId));
    const savedPostIds = new Set(userSaves.map((s) => s.postId));

    return {
      posts: posts.map((post) => ({
        ...this.formatPost(post, userId),
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      })),
      nextCursor: posts.length === limit ? posts[posts.length - 1]?.createdAt.toISOString() : null,
    };
  }

  /**
   * Get post by ID
   */
  async getPostById(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        outfit: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check visibility
    if (post.visibility === PostVisibility.PRIVATE && post.userId !== userId) {
      throw new ForbiddenException('You do not have access to this post');
    }

    if (post.visibility === PostVisibility.FOLLOWERS && post.userId !== userId) {
      const isFollowing = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: post.userId,
          },
        },
      });

      if (!isFollowing) {
        throw new ForbiddenException('You do not have access to this post');
      }
    }

    // Check if user liked this post
    const like = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    // Check if user saved this post
    const saved = await this.prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return {
      ...this.formatPost(post, userId),
      isLiked: !!like,
      isSaved: !!saved,
    };
  }

  /**
   * Delete post
   */
  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { success: true };
  }

  /**
   * Get posts by user
   */
  async getUserPosts(targetUserId: string, currentUserId: string, cursor?: string, limit = 20) {
    // Check if current user can see posts
    const isOwnProfile = targetUserId === currentUserId;

    const visibilityFilter: any = { userId: targetUserId };

    if (!isOwnProfile) {
      // Check if following
      const isFollowing = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });

      if (isFollowing) {
        // Can see public + followers
        visibilityFilter.visibility = { in: [PostVisibility.PUBLIC, PostVisibility.FOLLOWERS] };
      } else {
        // Can only see public
        visibilityFilter.visibility = PostVisibility.PUBLIC;
      }
    }

    const posts = await this.prisma.post.findMany({
      where: {
        ...visibilityFilter,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        outfit: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Check which posts user liked
    const postIds = posts.map((p) => p.id);
    const userLikes = await this.prisma.like.findMany({
      where: {
        userId: currentUserId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    return {
      posts: posts.map((post) => ({
        ...this.formatPost(post, currentUserId),
        isLiked: likedPostIds.has(post.id),
      })),
      nextCursor: posts.length === limit ? posts[posts.length - 1]?.createdAt.toISOString() : null,
    };
  }

  /**
   * Toggle like on post
   */
  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return { isLiked: false };
    } else {
      // Like
      await this.prisma.like.create({
        data: {
          postId,
          userId,
        },
      });

      // Create notification for post owner
      await this.notificationsService.createNotification(
        post.userId,
        userId,
        NotificationType.LIKE,
        NotificationTargetType.POST,
        postId,
      );

      return { isLiked: true };
    }
  }

  /**
   * Get users who liked a post
   */
  async getPostLikes(postId: string, currentUserId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const likes = await this.prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check which users current user is following
    const followingIds = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingSet = new Set(followingIds.map((f) => f.followingId));

    return likes.map((like) => ({
      userId: like.user.id,
      name: like.user.name,
      email: like.user.email,
      avatarUrl: like.user.avatarUrl,
      isFollowing: followingSet.has(like.user.id),
      likedAt: like.createdAt,
    }));
  }

  /**
   * Add comment to post
   */
  async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create notification for post owner
    await this.notificationsService.createNotification(
      post.userId,
      userId,
      NotificationType.COMMENT,
      NotificationTargetType.POST,
      postId,
      content.substring(0, 100), // Preview of comment
    );

    return {
      commentId: comment.id,
      content: comment.content,
      user: comment.user,
      createdAt: comment.createdAt,
      isOwnComment: comment.userId === userId,
    };
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string, userId: string, cursor?: string, limit = 50) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      comments: comments.map((comment) => ({
        commentId: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt,
        isOwnComment: comment.userId === userId,
      })),
      nextCursor: comments.length === limit ? comments[comments.length - 1]?.createdAt.toISOString() : null,
    };
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    // Can delete if own comment OR own post
    if (comment.userId !== userId && comment.post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments or comments on your posts');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  /**
   * Toggle save post
   */
  async toggleSave(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existingSave = await this.prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingSave) {
      // Unsave
      await this.prisma.savedPost.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return { isSaved: false };
    } else {
      // Save
      await this.prisma.savedPost.create({
        data: {
          userId,
          postId,
        },
      });
      return { isSaved: true };
    }
  }

  /**
   * Get saved posts
   */
  async getSavedPosts(userId: string, cursor?: string, limit = 20) {
    const savedPosts = await this.prisma.savedPost.findMany({
      where: {
        userId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            outfit: {
              include: {
                items: {
                  include: {
                    item: true,
                  },
                },
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
    });

    // Check which posts user liked
    const postIds = savedPosts.map((sp) => sp.post.id);
    const userLikes = await this.prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    return {
      posts: savedPosts.map((sp) => ({
        ...this.formatPost(sp.post, userId),
        isLiked: likedPostIds.has(sp.post.id),
        isSaved: true,
        savedAt: sp.createdAt,
      })),
      nextCursor: savedPosts.length === limit ? savedPosts[savedPosts.length - 1]?.createdAt.toISOString() : null,
    };
  }

  /**
   * Format post response
   */
  private formatPost(post: any, currentUserId: string) {
    return {
      postId: post.id,
      caption: post.caption,
      mediaUrls: post.mediaUrls,
      visibility: post.visibility,
      user: post.user,
      outfit: post.outfit || null,
      likesCount: post._count?.likes || 0,
      commentsCount: post._count?.comments || 0,
      isOwnPost: post.userId === currentUserId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
