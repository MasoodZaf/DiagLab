import type { BadgeTone } from "@lab/ui";
import type {
  InvoiceStatus,
  ReportRecord,
  ResultStatus,
  SampleStatus
} from "@lab/contracts";
import type { Translator } from "./i18n";

export function sampleStatusTone(status: SampleStatus): BadgeTone {
  switch (status) {
    case "released":
    case "verified":
    case "completed":
      return "success";
    case "rejected":
    case "cancelled":
      return "danger";
    case "processing":
    case "in_transit":
    case "received":
      return "info";
    case "amended":
      return "warning";
    default:
      return "neutral";
  }
}

export function resultStatusTone(status: ResultStatus): BadgeTone {
  switch (status) {
    case "validated":
    case "released":
      return "success";
    case "flagged":
      return "danger";
    case "amended":
      return "warning";
    case "entered":
      return "info";
    default:
      return "neutral";
  }
}

export function invoiceStatusTone(status: InvoiceStatus): BadgeTone {
  switch (status) {
    case "paid":
      return "success";
    case "partially_paid":
    case "issued":
      return "warning";
    case "refunded":
    case "void":
      return "danger";
    default:
      return "neutral";
  }
}

export function reportStatusTone(status: ReportRecord["status"]): BadgeTone {
  switch (status) {
    case "released":
      return "success";
    case "amended":
      return "warning";
    default:
      return "neutral";
  }
}

export const sampleStatusLabel = (status: SampleStatus, t: Translator) => t(`sampleStatus.${status}`);
export const resultStatusLabel = (status: ResultStatus, t: Translator) => t(`resultStatus.${status}`);
export const invoiceStatusLabel = (status: InvoiceStatus, t: Translator) => t(`invoiceStatus.${status}`);
export const reportStatusLabel = (status: ReportRecord["status"], t: Translator) => t(`reportStatus.${status}`);
