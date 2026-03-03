import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function AppFooter() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        Copyright by BasicsLab. All rights reserved. Powered by MechatronicsLab.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    paddingTop: 8,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: "#d8e2f0",
  },
  text: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
