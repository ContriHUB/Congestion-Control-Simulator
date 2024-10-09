import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders learn react link", () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test("renders header correctly", () => {
  render(<App />);
  const headerElement = screen.getByText(/React App/i); // Adjust based on your actual header content
  expect(headerElement).toBeInTheDocument();
});
