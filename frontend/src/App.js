import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Login from "./login";
import Dashboard from "./Dashboard";

function login() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default login;