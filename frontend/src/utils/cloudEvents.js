export const ALERTS_UPDATED_EVENT = 'cloud-alerts-updated';
export const USAGE_DATA_UPDATED_EVENT = 'cloud-usage-data-updated';

export const dispatchAlertsUpdated = () => {
  window.dispatchEvent(
    new CustomEvent(ALERTS_UPDATED_EVENT, {
      detail: { updatedAt: new Date().toISOString() },
    }),
  );
};

export const dispatchUsageUpdated = (records = []) => {
  window.dispatchEvent(
    new CustomEvent(USAGE_DATA_UPDATED_EVENT, {
      detail: {
        updatedAt: new Date().toISOString(),
        records,
      },
    }),
  );
};
