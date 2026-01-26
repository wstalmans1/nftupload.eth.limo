"use client";

import type { ComponentType, PropsWithChildren } from "react";
import { useEffect, useState } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
  const [Providers, setProviders] = useState<ComponentType<PropsWithChildren> | null>(
    null
  );

  useEffect(() => {
    let active = true;
    import("./providers-inner").then((mod) => {
      if (active) {
        setProviders(() => mod.Providers);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!Providers) {
    return null;
  }

  return <Providers>{children}</Providers>;
}
