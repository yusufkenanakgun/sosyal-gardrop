import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { NotificationsService, NotificationType } from '../modules/notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: { email: string; passwordHash: string; name?: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async setRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId }, // Exclude current user
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSuggestedUsers(currentUserId: string): Promise<User[]> {
    // Get users that current user is NOT following
    const following = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    return this.prisma.user.findMany({
      where: {
        id: {
          notIn: [...followingIds, currentUserId],
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserProfile(userId: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return null;

    // Check if current user follows this user
    const isFollowing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing: !!isFollowing,
      isOwnProfile: userId === currentUserId,
    };
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }

  // ============================================
  // FOLLOW SYSTEM
  // ============================================

  async followUser(followerId: string, followingId: string): Promise<void> {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      throw new Error('Already following this user');
    }

    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification for the user being followed
    await this.notificationsService.createNotification(
      followingId,
      followerId,
      NotificationType.FOLLOW,
    );
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async getFollowers(userId: string, currentUserId: string) {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check which followers the current user is following
    const currentUserFollowing = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = new Set(currentUserFollowing.map((f) => f.followingId));

    return followers.map((f) => ({
      userId: f.follower.id,
      name: f.follower.name,
      email: f.follower.email,
      avatarUrl: f.follower.avatarUrl,
      bio: f.follower.bio,
      isFollowing: followingIds.has(f.follower.id),
      followedAt: f.createdAt,
    }));
  }

  async getFollowing(userId: string, currentUserId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check which users the current user is following
    const currentUserFollowing = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = new Set(currentUserFollowing.map((f) => f.followingId));

    return following.map((f) => ({
      userId: f.following.id,
      name: f.following.name,
      email: f.following.email,
      avatarUrl: f.following.avatarUrl,
      bio: f.following.bio,
      isFollowing: followingIds.has(f.following.id),
      followedAt: f.createdAt,
    }));
  }
}
