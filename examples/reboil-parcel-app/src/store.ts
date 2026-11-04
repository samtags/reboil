import { createStore } from "reboil";

const initialState = {
  count: 1,
  lastAction: '',
};

export const { store, useStore } = createStore(initialState, {
  id: "reboil-parcel-app",
  logger: true,
});
