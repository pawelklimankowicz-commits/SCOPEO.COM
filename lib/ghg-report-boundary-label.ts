/** Czytelna etykieta granicy (wartosci z profilu / bazy); ASCII — bezpieczne przy Helvetica bez fontu z PL. */
export function formatBoundaryApproachLabel(raw: string): string {
  switch (raw) {
    case 'operational_control':
      return 'kontrola operacyjna (operational control)';
    case 'financial_control':
      return 'kontrola finansowa (financial control)';
    case 'equity_share':
      return 'udzial kapitalowy (equity share)';
    default:
      return raw.replace(/_/g, ' ');
  }
}
