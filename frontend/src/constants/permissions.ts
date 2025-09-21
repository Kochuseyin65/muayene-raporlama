// CODEBASE_REPORT.md permissions list (source of truth)
export const PERMISSIONS = [
  'companyAdmin', 'superAdmin',
  'viewTechnicians', 'createTechnician', 'editTechnician', 'deleteTechnician',
  'viewCustomers', 'createCustomer', 'editCustomer',
  'viewEquipment', 'createEquipment', 'editEquipment',
  'viewOffers', 'createOffer', 'editOffer', 'approveOffer', 'sendOffer',
  'viewWorkOrders', 'viewMyWorkOrders', 'createWorkOrder', 'editWorkOrder', 'assignWorkOrder', 'updateWorkOrderStatus',
  'viewInspections', 'viewMyInspections', 'editInspection', 'saveInspection', 'completeInspection', 'uploadPhotos',
  'viewReports', 'downloadReports', 'signReports', 'sendReports',
  'viewDashboard', 'viewCalendar',
] as const

export type Permission = typeof PERMISSIONS[number]
