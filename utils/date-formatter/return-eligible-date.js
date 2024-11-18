export function return_eligible_date(placedAt) {
  const placedDate = new Date(placedAt);
  placedDate.setDate(placedDate.getDate() + 7);
  return placedDate;
}
