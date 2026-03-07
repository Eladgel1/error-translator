import "@testing-library/jest-dom";
import { vi } from "vitest";

// Extend clipboard type for testing
interface ClipboardMock {
  writeText: (text: string) => Promise<void>;
}

// Ensure navigator exists before mocking
if (typeof navigator === "undefined") {
  global.navigator = {} as Navigator;
}

// Ensure clipboard exists before mocking
if (!navigator.clipboard) {
  // @ts-expect-error - override clipboard for test environment
  navigator.clipboard = {
    writeText: vi.fn(async () => {}),
  } as ClipboardMock;
} else {
  navigator.clipboard.writeText = vi.fn(async () => {});
}
