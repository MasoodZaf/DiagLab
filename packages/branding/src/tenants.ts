import type { TenantConfig } from "@lab/contracts";

export const tenantPresets: Record<string, TenantConfig> = {
  lumen: {
    id: "tenant_lumen",
    slug: "lumen",
    brandName: "Lumen Diagnostics",
    domains: ["lumen.localhost"],
    locale: "en-PK",
    timezone: "Asia/Karachi",
    heroStyle: "editorial",
    logos: {
      horizontal: "LD",
      square: "L",
      favicon: "L"
    },
    tokens: {
      fontDisplay: "\"Iowan Old Style\", \"Palatino Linotype\", serif",
      fontBody: "\"Avenir Next\", \"Segoe UI\", sans-serif",
      colorPrimary: "#174c4f",
      colorPrimaryForeground: "#f7faf9",
      colorAccentSurface: "#e6f1ef",
      colorCanvas: "#f7f8f6",
      colorPanel: "#ffffff",
      colorPanelMuted: "#f1f4f2",
      colorLine: "#d3ddd9",
      colorText: "#102625",
      colorTextMuted: "#5d6f6d",
      colorSuccess: "#1d7a59",
      colorWarning: "#aa6b15",
      colorDanger: "#a33e37",
      radius: "22px",
      density: "comfortable"
    },
    reportTemplate: {
      headerLabel: "Precision reports for every clinical decision.",
      footerNote: "Confidential medical record. Verify QR before external circulation.",
      showQrVerification: true
    },
    notifications: {
      emailFromName: "Lumen Diagnostics",
      smsSender: "LUMEN",
      whatsappSender: "Lumen Reports",
      templates: {
        appointmentBooked: {
          email: {
            subject: "{{brandName}} appointment confirmed",
            body: "Hello {{patientName}}, your {{brandName}} appointment for {{appointmentTime}} at {{branchName}} is confirmed. Order {{orderNumber}} is ready for collection workflow.",
            ctaLabel: "View appointment"
          },
          sms: {
            body: "Lumen: {{patientName}}, your appointment is confirmed for {{appointmentTime}} at {{branchName}}. Order {{orderNumber}}."
          },
          whatsapp: {
            body: "{{brandName}} confirms your appointment for {{appointmentTime}}. Reply HELP if you need collection support."
          },
          in_app: {
            body: "Your appointment is confirmed for {{appointmentTime}}."
          }
        },
        sampleCollected: {
          email: {
            subject: "{{brandName}} sample collected",
            body: "Your sample {{barcode}} was collected and is now moving through {{brandName}} tracking. Current checkpoint: {{checkpoint}}."
          },
          sms: {
            body: "Lumen: sample {{barcode}} collected. Track status in your portal."
          },
          whatsapp: {
            body: "Sample {{barcode}} collected. Current checkpoint: {{checkpoint}}."
          },
          push: {
            body: "Sample collected: {{barcode}}"
          },
          in_app: {
            body: "Sample {{barcode}} has been collected."
          }
        },
        paymentReceived: {
          email: {
            subject: "{{brandName}} payment received",
            body: "We received {{amount}} for invoice {{invoiceNumber}}. Thank you for choosing {{brandName}}."
          },
          sms: {
            body: "Lumen: payment {{amount}} received for {{invoiceNumber}}."
          },
          whatsapp: {
            body: "Payment received for {{invoiceNumber}}: {{amount}}."
          },
          in_app: {
            body: "Payment received for {{invoiceNumber}}."
          }
        },
        reportReleased: {
          email: {
            subject: "{{brandName}} report ready: {{reportNumber}}",
            body: "Your report {{reportNumber}} has been released by {{releasedBy}}. Use OTP-protected portal access before sharing externally.",
            ctaLabel: "Open report"
          },
          sms: {
            body: "Lumen: report {{reportNumber}} is ready. Sign in with OTP to view."
          },
          whatsapp: {
            body: "{{brandName}} report {{reportNumber}} is ready. For privacy, open it through the secure portal."
          },
          push: {
            body: "Report {{reportNumber}} is ready."
          },
          in_app: {
            body: "Report {{reportNumber}} is available in your portal."
          }
        },
        criticalFollowup: {
          email: {
            subject: "{{brandName}} clinical follow-up",
            body: "A clinician has reviewed {{testName}} and may contact you for follow-up. This message does not replace medical advice."
          },
          whatsapp: {
            body: "{{brandName}} clinical team may contact you about {{testName}}. Please keep your phone available."
          },
          in_app: {
            body: "Clinical follow-up may be required for {{testName}}."
          }
        }
      }
    },
    features: {
      onlineBooking: true,
      homeCollection: true,
      payments: true,
      aiPatientExplanation: true,
      aiResultSummary: true,
      phlebotomyApp: true
    },
    policies: {
      allowCreditBilling: false,
      requireOtpForReports: true,
      requirePathologistApproval: true,
      enableCriticalCallLogging: true
    }
  },
  cedar: {
    id: "tenant_cedar",
    slug: "cedar",
    brandName: "Cedar PathLab",
    domains: ["cedar.localhost"],
    locale: "en-GB",
    timezone: "Europe/London",
    heroStyle: "clinical",
    logos: {
      horizontal: "CP",
      square: "C",
      favicon: "C"
    },
    tokens: {
      fontDisplay: "\"Baskerville\", \"Times New Roman\", serif",
      fontBody: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif",
      colorPrimary: "#1f3f73",
      colorPrimaryForeground: "#fafcff",
      colorAccentSurface: "#e8eef8",
      colorCanvas: "#f5f7fb",
      colorPanel: "#ffffff",
      colorPanelMuted: "#eef2f9",
      colorLine: "#d2daea",
      colorText: "#16233a",
      colorTextMuted: "#62708b",
      colorSuccess: "#1f7a62",
      colorWarning: "#9a701f",
      colorDanger: "#a23f4a",
      radius: "18px",
      density: "compact"
    },
    reportTemplate: {
      headerLabel: "Trusted diagnostics for connected care teams.",
      footerNote: "Released results remain subject to amendment traceability and tenant policy.",
      showQrVerification: true
    },
    notifications: {
      emailFromName: "Cedar PathLab",
      smsSender: "CEDAR",
      whatsappSender: "Cedar Reports",
      templates: {
        appointmentBooked: {
          email: {
            subject: "{{brandName}} booking confirmed",
            body: "Hello {{patientName}}, your Cedar PathLab booking for {{appointmentTime}} at {{branchName}} is confirmed. Reference {{orderNumber}}.",
            ctaLabel: "Manage booking"
          },
          sms: {
            body: "Cedar: booking confirmed for {{appointmentTime}} at {{branchName}}. Ref {{orderNumber}}."
          },
          whatsapp: {
            body: "Cedar PathLab confirms your appointment for {{appointmentTime}}. Reference {{orderNumber}}."
          },
          in_app: {
            body: "Your Cedar booking is confirmed for {{appointmentTime}}."
          }
        },
        sampleCollected: {
          email: {
            subject: "Cedar PathLab sample update",
            body: "Sample {{barcode}} has entered Cedar PathLab tracking. Current checkpoint: {{checkpoint}}."
          },
          sms: {
            body: "Cedar: sample {{barcode}} collected."
          },
          whatsapp: {
            body: "Sample {{barcode}} collected. Checkpoint: {{checkpoint}}."
          },
          push: {
            body: "Sample {{barcode}} collected."
          },
          in_app: {
            body: "Sample {{barcode}} is now tracked."
          }
        },
        paymentReceived: {
          email: {
            subject: "Cedar PathLab receipt {{invoiceNumber}}",
            body: "Payment of {{amount}} has been received for {{invoiceNumber}}."
          },
          sms: {
            body: "Cedar: {{amount}} received for {{invoiceNumber}}."
          },
          whatsapp: {
            body: "Payment received: {{amount}} for {{invoiceNumber}}."
          },
          in_app: {
            body: "Payment recorded for {{invoiceNumber}}."
          }
        },
        reportReleased: {
          email: {
            subject: "Cedar PathLab report available",
            body: "Report {{reportNumber}} has been released by {{releasedBy}} and is available through secure portal access.",
            ctaLabel: "View report"
          },
          sms: {
            body: "Cedar: report {{reportNumber}} is ready for secure viewing."
          },
          whatsapp: {
            body: "Cedar PathLab report {{reportNumber}} is ready. Please use secure portal access."
          },
          push: {
            body: "Cedar report {{reportNumber}} is ready."
          },
          in_app: {
            body: "Report {{reportNumber}} is ready."
          }
        },
        criticalFollowup: {
          email: {
            subject: "Cedar PathLab clinical follow-up",
            body: "A clinician has reviewed {{testName}} and may contact you. This is a safety follow-up message."
          },
          whatsapp: {
            body: "Cedar PathLab may contact you for clinical follow-up on {{testName}}."
          },
          in_app: {
            body: "Clinical follow-up may be required for {{testName}}."
          }
        }
      }
    },
    features: {
      onlineBooking: true,
      homeCollection: false,
      payments: true,
      aiPatientExplanation: false,
      aiResultSummary: true,
      phlebotomyApp: true
    },
    policies: {
      allowCreditBilling: true,
      requireOtpForReports: true,
      requirePathologistApproval: true,
      enableCriticalCallLogging: true
    }
  }
};

export function getTenantConfig(slug = "lumen"): TenantConfig {
  return tenantPresets[slug] ?? tenantPresets.lumen;
}
