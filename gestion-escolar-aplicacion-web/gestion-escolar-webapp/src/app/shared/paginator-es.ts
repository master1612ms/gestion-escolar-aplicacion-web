// src\app\shared\paginator-es.ts
import { MatPaginatorIntl } from '@angular/material/paginator';

export function getPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'Elementos por página';
  paginatorIntl.nextPageLabel = 'Siguiente página';
  paginatorIntl.previousPageLabel = 'Página anterior';
  paginatorIntl.firstPageLabel = 'Primera página';
  paginatorIntl.lastPageLabel = 'Última página';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }

    if (length === 1) {
      return '1 de 1';
    }

    const startIndex = page * pageSize;
    return `${Math.min(startIndex + 1, length)} de ${length}`;
  };

  return paginatorIntl;
}
