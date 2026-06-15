import { describe, expect, it } from 'vitest';
import { getRecentHeroTitle } from './heroCopy';

describe('getRecentHeroTitle', () => {
  it('uses neutral copy instead of the uploader name', () => {
    const title = getRecentHeroTitle({ uploaderName: 'Rohit' });

    expect(title).toBe('Latest shared moment');
    expect(title).not.toContain('Rohit');
  });
});
