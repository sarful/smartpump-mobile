import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { mobileHistoryApi, MobileHistoryEntry } from "../services/mobileHistoryApi";

type AuthorizedRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

type Props = {
  authorizedRequest: AuthorizedRequest;
  title?: string;
  limit?: number;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatEventLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function HistoryPanel({
  authorizedRequest,
  title = "Recent History",
  limit = 20,
}: Props) {
  const [entries, setEntries] = useState<MobileHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mobileHistoryApi.list(authorizedRequest, limit);
      setEntries(result.entries);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {loading ? <Text style={styles.info}>Loading history...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && entries.length === 0 ? (
        <Text style={styles.info}>No history found for this account.</Text>
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <View style={styles.list}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.item}>
              <Text style={styles.itemTitle}>{formatEventLabel(entry.event)}</Text>
              <Text style={styles.itemText}>Date: {formatDate(entry.date)}</Text>
              {entry.userName ? <Text style={styles.itemText}>User: {entry.userName}</Text> : null}
              {entry.adminName ? <Text style={styles.itemText}>Admin: {entry.adminName}</Text> : null}
              {typeof entry.usedMinutes === "number" ? (
                <Text style={styles.itemText}>Used: {entry.usedMinutes}m</Text>
              ) : null}
              {typeof entry.addedMinutes === "number" ? (
                <Text style={styles.itemText}>Added: {entry.addedMinutes}m</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  info: { color: "#475569", fontSize: 13 },
  error: { color: "#b91c1c", fontSize: 13 },
  list: { gap: 8 },
  item: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f8fafc",
    gap: 2,
  },
  itemTitle: { color: "#0f172a", fontWeight: "700" },
  itemText: { color: "#475569", fontSize: 12 },
});
