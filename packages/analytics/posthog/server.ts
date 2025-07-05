import 'server-only';
import { PostHog } from 'posthog-node';
import { keys } from '../keys';

let _analytics: PostHog | null = null;

const getAnalytics = () => {
  if (!_analytics) {
    const { NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST } = keys();

    if (!NEXT_PUBLIC_POSTHOG_KEY || !NEXT_PUBLIC_POSTHOG_HOST) {
      throw new Error('PostHog environment variables are not configured');
    }

    _analytics = new PostHog(NEXT_PUBLIC_POSTHOG_KEY, {
      host: NEXT_PUBLIC_POSTHOG_HOST,

      // Don't batch events and flush immediately - we're running in a serverless environment
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return _analytics;
};

export const analytics = {
  capture: (...args: Parameters<PostHog['capture']>) => getAnalytics().capture(...args),
  identify: (...args: Parameters<PostHog['identify']>) => getAnalytics().identify(...args),
  groupIdentify: (...args: Parameters<PostHog['groupIdentify']>) => getAnalytics().groupIdentify(...args),
  shutdown: () => getAnalytics().shutdown(),
};
