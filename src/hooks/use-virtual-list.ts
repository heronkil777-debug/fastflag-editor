/**
 * useVirtualList — Virtualização de lista para performance com milhares de flags.
 *
 * Estratégia (sem dependências externas):
 * 1. Renderiza um "window" (N itens visíveis) + overscan
 * 2. Calcula a altura total como se todos fossem renderizados
 * 3. Usa padding-top/padding-bottom para criar a ilusão de scroll completo
 *
 * Para 10K+ flags, isso reduz DOM nodes de 10K → ~30 (15 visíveis + overscan).
 *
 * Params:
 * @param items - Array de itens a serem renderizados
 * @param rowHeight - Altura de cada linha em pixels
 * @param containerHeight - Altura do container visível em pixels
 * @param overscan - Quantas linhas extras renderizar acima/abaixo (default: 5)
 *
 * Retorna:
 * @returns { visibleItems, totalHeight, offsetY, onScroll, scrollRef }
 */

import { useState, useCallback, useRef, useMemo } from 'react';

interface VirtualListOptions<T> {
  /** Array de todos os itens */
  items: T[];
  /** Altura de cada linha em px */
  rowHeight: number;
  /** Altura do container visível */
  containerHeight: number;
  /** Linhas extras acima/abaixo do viewport */
  overscan?: number;
}

interface VirtualListResult<T> {
  /** Itens que devem ser renderizados agora */
  visibleItems: { index: number; item: T }[];
  /** Altura total do "spacer" em px */
  totalHeight: number;
  /** Offset Y para posicionar os itens corretamente */
  offsetY: number;
  /** Handler para onScroll do container */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** Renderiza o container */
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function useVirtualList<T>({
  items,
  rowHeight,
  containerHeight,
  overscan = 3,
}: VirtualListOptions<T>): VirtualListResult<T> {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const totalItems = items.length;
    const totalHeight = totalItems * rowHeight;

    // Calcular o range visível
    const startIdx = Math.floor(scrollTop / rowHeight) - overscan;
    const endIdx = Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan;

    const clampedStart = Math.max(0, startIdx);
    const clampedEnd = Math.min(totalItems, endIdx);

    const visibleItems = [];
    for (let i = clampedStart; i < clampedEnd; i++) {
      visibleItems.push({ index: i, item: items[i] });
    }

    const offsetY = clampedStart * rowHeight;

    return { visibleItems, totalHeight, offsetY };
  }, [items, rowHeight, containerHeight, overscan, scrollTop]);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
    scrollRef,
  };
}