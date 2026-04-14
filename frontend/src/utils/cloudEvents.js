export const ALERTS_UPDATED_EVENT = 'cloud-alerts-updated';
export const USAGE_DATA_UPDATED_EVENT = 'cloud-usage-data-updated';

// Key used to track whether a CSV has been uploaded in this browser
export const CSV_UPLOADED_KEY = 'cloudoptix_csv_uploaded';

export const dispatchAlertsUpdated = () => {
  window.dispatchEvent(
    new CustomEvent(ALERTS_UPDATED_EVENT, {
      detail: { updatedAt: new Date().toISOString() },
    }),
  );
};

export const dispatchUsageUpdated = (records = []) => {
  // Mark that a CSV has been uploaded in this browser session
  localStorage.setItem(CSV_UPLOADED_KEY, 'true');

  window.dispatchEvent(
    new CustomEvent(USAGE_DATA_UPDATED_EVENT, {
      detail: {
        updatedAt: new Date().toISOString(),
        records,
      },
    }),
  );
};
