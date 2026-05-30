import { getTenantConfig } from "@lab/branding";
import { roleCapabilities, sampleWorkflowRules, type MobileSyncAction } from "@lab/contracts";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const tenant = getTenantConfig("lumen");
const phlebotomistCapabilities = roleCapabilities.find((entry) => entry.role === "phlebotomist");
const phlebotomistActor = {
  id: "sess_lumen_phleb",
  tenantId: tenant.id,
  role: "phlebotomist" as const,
  displayName: "Bilal Ahmed",
  branchName: "Gulberg",
  capabilities: phlebotomistCapabilities?.capabilities ?? []
};

const offlineQueue: MobileSyncAction[] = [
  {
    clientActionId: "mobile-sample-collected-001",
    tenantId: tenant.id,
    actor: phlebotomistActor,
    type: "sample_transition",
    entityId: "sam_mobile_127",
    occurredAt: "2026-05-29T07:30:00Z",
    payload: {
      nextStatus: "collected",
      checkpoint: "Home collection captured with barcode and signature"
    }
  },
  {
    clientActionId: "mobile-gps-001",
    tenantId: tenant.id,
    actor: phlebotomistActor,
    type: "gps_checkpoint",
    entityId: "sam_mobile_127",
    occurredAt: "2026-05-29T07:31:00Z",
    payload: {
      checkpoint: "Patient doorstep GPS proof",
      latitude: 31.5204,
      longitude: 74.3587
    }
  }
];

export default function App() {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tenant.tokens.colorCanvas }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.heroCard, { backgroundColor: tenant.tokens.colorPanel, borderColor: tenant.tokens.colorLine }]}>
          <Text style={[styles.eyebrow, { color: tenant.tokens.colorTextMuted }]}>{tenant.brandName}</Text>
          <Text style={[styles.heading, { color: tenant.tokens.colorText }]}>Mobile foundation for patient and phlebotomist journeys.</Text>
          <Text style={[styles.body, { color: tenant.tokens.colorTextMuted }]}>
            Offline-safe collection and premium patient access share the same tenant policy, branding, and workflow contract.
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={[styles.panel, { backgroundColor: tenant.tokens.colorPanel, borderColor: tenant.tokens.colorLine }]}>
            <Text style={[styles.panelTitle, { color: tenant.tokens.colorText }]}>Patient app</Text>
            <Text style={[styles.body, { color: tenant.tokens.colorTextMuted }]}>Booking, report retrieval, payments, and notifications remain branded per tenant.</Text>
          </View>
          <View style={[styles.panel, { backgroundColor: tenant.tokens.colorPanel, borderColor: tenant.tokens.colorLine }]}>
            <Text style={[styles.panelTitle, { color: tenant.tokens.colorText }]}>Phlebotomist app</Text>
            <Text style={[styles.body, { color: tenant.tokens.colorTextMuted }]}>Assignments, barcode capture, GPS evidence, offline queueing, and reconciliation lead mobile execution.</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: tenant.tokens.colorPanel, borderColor: tenant.tokens.colorLine }]}>
          <Text style={[styles.panelTitle, { color: tenant.tokens.colorText }]}>Capabilities</Text>
          {phlebotomistCapabilities?.capabilities.map((capability) => (
            <View key={capability} style={[styles.badge, { backgroundColor: tenant.tokens.colorAccentSurface }]}>
              <Text style={[styles.badgeText, { color: tenant.tokens.colorText }]}>{capability}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: tenant.tokens.colorPanel, borderColor: tenant.tokens.colorLine }]}>
          <Text style={[styles.panelTitle, { color: tenant.tokens.colorText }]}>Offline-sensitive workflow states</Text>
          {sampleWorkflowRules.slice(0, 5).map((rule) => (
            <Text key={`${rule.from}-${rule.to}`} style={[styles.rule, { color: tenant.tokens.colorTextMuted }]}>
              {`${rule.from} -> ${rule.to}`}
            </Text>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: tenant.tokens.colorPanel, borderColor: tenant.tokens.colorLine }]}>
          <Text style={[styles.panelTitle, { color: tenant.tokens.colorText }]}>Offline queue preview</Text>
          <Text style={[styles.body, { color: tenant.tokens.colorTextMuted }]}>
            Actions use idempotent client IDs so retrying after signal loss does not duplicate collection evidence.
          </Text>
          {offlineQueue.map((action) => (
            <View key={action.clientActionId} style={[styles.queueItem, { backgroundColor: tenant.tokens.colorPanelMuted }]}>
              <Text style={[styles.queueTitle, { color: tenant.tokens.colorText }]}>{action.type}</Text>
              <Text style={[styles.rule, { color: tenant.tokens.colorTextMuted }]}>{action.clientActionId}</Text>
              <Text style={[styles.rule, { color: tenant.tokens.colorTextMuted }]}>Entity {action.entityId}</Text>
              <Text style={[styles.rule, { color: tenant.tokens.colorTextMuted }]}>{action.payload.checkpoint}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: tenant.tokens.colorPanel, borderColor: tenant.tokens.colorLine }]}>
          <Text style={[styles.panelTitle, { color: tenant.tokens.colorText }]}>Reconciliation result</Text>
          {["accepted", "duplicate", "conflict", "rejected"].map((status) => (
            <View key={status} style={[styles.badge, { backgroundColor: tenant.tokens.colorAccentSurface }]}>
              <Text style={[styles.badgeText, { color: tenant.tokens.colorText }]}>{status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  container: {
    gap: 16,
    padding: 16
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    marginTop: 12
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12
  },
  grid: {
    gap: 16
  },
  panel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  badge: {
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start"
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600"
  },
  rule: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10
  },
  queueItem: {
    borderRadius: 18,
    marginTop: 12,
    padding: 14
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase"
  }
});
