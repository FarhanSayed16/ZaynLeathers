/**
 * No-op shipping provider used when SHIPPING_ENABLED !== "true".
 */

const disabled = (action = "Shipping") => {
  const err = new Error(`${action} partner is disabled. Set SHIPPING_ENABLED=true to enable.`);
  err.code = "SHIPPING_DISABLED";
  throw err;
};

const manualProvider = {
  name: "manual",

  async createShipment() {
    return disabled("Shipping");
  },

  async generateLabel() {
    return disabled("Label");
  },

  async requestPickup() {
    return disabled("Pickup");
  },

  async trackShipment() {
    return { manual: true, events: [] };
  },

  async cancelShipment() {
    return { manual: true, cancelled: false };
  },

  async createReturn() {
    return disabled("Return");
  },

  async checkServiceability() {
    return {
      serviceable: true,
      manual: true,
      couriers: [],
      cheapest: null,
      recommended: null,
      estimatedDays: null,
      estimatedRate: null,
      message: "Shipping partner disabled — serviceability not checked",
    };
  },

  async getCourierRates() {
    return this.checkServiceability();
  },
};

export default manualProvider;
