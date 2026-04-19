import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import assessmentReducer from "../slices/assessmentSlice";
import assessmentSaga from "../sagas/assessmentSaga";

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    assessment: assessmentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

// Run the saga
sagaMiddleware.run(assessmentSaga);

export default store;
