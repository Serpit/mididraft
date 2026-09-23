import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import * as TanstackQuery from './integrations/tanstack-query/root-provider';
import { routeTree } from './routeTree.gen';

/**
 * TanStack Router instance
 * https://github.com/TanStack/router/blob/main/examples/react/start-basic-cloudflare/src/router.tsx
 * https://github.com/backpine/tanstack-start-on-cloudflare/blob/main/src/router.tsx
 */
export const getRouter = () => {
  const queryContext = TanstackQuery.getContext();

  const router = createRouter({
    routeTree,
    context: { ...queryContext },
    defaultPreload: 'intent',
    scrollRestoration: true,
    // Wrap: provides NuqsAdapter and TanstackQuery.Provider for SSR
    // These providers wrap the entire route tree content (not RootDocument)
    // RootDocument (shellComponent)
    // └─ Wrap (NuqsAdapter + TanstackQuery.Provider)
    //     └─ Route tree content (RootComponent / errorComponent / notFoundComponent)
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <NuqsAdapter>
          <TanstackQuery.Provider {...queryContext}>
            {props.children}
          </TanstackQuery.Provider>
        </NuqsAdapter>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: queryContext.queryClient,
  });

  return router;
};
