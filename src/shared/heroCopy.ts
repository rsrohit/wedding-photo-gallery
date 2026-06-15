export type RecentHeroTitleSource = {
  uploaderName: string;
};

export function getRecentHeroTitle(_photo: RecentHeroTitleSource): string {
  return 'Latest shared moment';
}
