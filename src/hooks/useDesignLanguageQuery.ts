/**
 * useDesignLanguageQuery
 * Provides query methods for tokens based on the current graph
 * Separated from context to avoid re-renders on query method calls
 */

import { useMemo } from 'react';
import { useDesignLanguageData } from '@/context/DesignLanguageDataContext';
import { StyleNode } from '@/types/styleGraph';
import { getTokenByPath, getTokensByType, getTokensByLayer } from '@/utils/designLanguageTokenMapper';

interface DesignLanguageQueryResult {
  getTokenByPath: (path: string) => StyleNode | undefined;
  getTokensByType: (type: string) => StyleNode[];
  getTokensByLayer: (layer: string) => StyleNode[];
  nodes: StyleNode[];
}

export function useDesignLanguageQuery(): DesignLanguageQueryResult {
  const { graph } = useDesignLanguageData();

  const nodes = useMemo(() => {
    return graph ? Array.from(graph.nodes.values()) : [];
  }, [graph]);

  const queryTokenByPath = useMemo(
    () => (path: string) => getTokenByPath(nodes, path),
    [nodes]
  );

  const queryTokensByType = useMemo(
    () => (type: string) => getTokensByType(nodes, type),
    [nodes]
  );

  const queryTokensByLayer = useMemo(
    () => (layer: string) => getTokensByLayer(nodes, layer),
    [nodes]
  );

  return {
    getTokenByPath: queryTokenByPath,
    getTokensByType: queryTokensByType,
    getTokensByLayer: queryTokensByLayer,
    nodes,
  };
}
