'use client';

import { Avatar } from '../ui';

interface Story {
  id: string;
  username: string;
  avatarUrl?: string;
}

// Mock stories for demonstration
const mockStories: Story[] = [
  { id: '1', username: 'yourStory' },
  { id: '2', username: 'fashion_lover' },
  { id: '3', username: 'style_guru' },
  { id: '4', username: 'trendy_outfits' },
  { id: '5', username: 'wardrobe_ideas' },
  { id: '6', username: 'chic_style' },
  { id: '7', username: 'outfit_inspo' },
  { id: '8', username: 'fashion_daily' },
];

export function StoryBar() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {mockStories.map((story, index) => (
          <div
            key={story.id}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <div className={index === 0 ? 'relative' : ''}>
              <Avatar
                alt={story.username}
                size="lg"
                hasStory={index !== 0}
                src={story.avatarUrl}
              />
              {index === 0 && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 max-w-[64px] truncate">
              {index === 0 ? 'Your Story' : story.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
