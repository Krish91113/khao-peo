import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "../../application/services/auth.service.js";
import { userRepository } from "../../infrastructure/repositories/user.repository.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

vi.mock("../../infrastructure/repositories/user.repository.js");
vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

describe("AuthService Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        _id: "user123",
        fullName: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        role: "restaurant_admin",
        status: "active",
        token_version: 0,
        permissions_override: [],
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
      vi.mocked(jwt.sign).mockReturnValue("mockedtoken" as any);

      const result = await authService.login("test@example.com", "password123");

      expect(result.access_token).toBe("mockedtoken");
      expect(result.user.email).toBe("test@example.com");
      expect(userRepository.resetFailedLogins).toHaveBeenCalledWith("user123");
      expect(userRepository.updateByIdNoTenant).toHaveBeenCalledWith("user123", expect.any(Object));
    });

    it("should throw error and increment failed logins on invalid password", async () => {
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        password: "hashedpassword",
        status: "active",
        failed_login_count: 0,
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(authService.login("test@example.com", "wrongpassword")).rejects.toThrow(
        "Invalid credentials",
      );
      expect(userRepository.incrementFailedLogins).toHaveBeenCalledWith("user123");
    });
  });
});
