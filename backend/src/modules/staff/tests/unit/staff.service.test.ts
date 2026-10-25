// ─── Staff Service Unit Tests ─────────────────────────────────────────────────
// KP-FRD-002: Unit tests for business rules (BR-003..BR-010), employee code
// generation, soft delete and audit events.

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  staffRepo: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByPhone: vi.fn(),
    findLatestEmployeeCode: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    softDelete: vi.fn(),
    countActive: vi.fn(),
  },
  auditRepo: { create: vi.fn(), findByEntity: vi.fn() },
  restaurantRepo: { findById: vi.fn() },
  bcrypt: { genSalt: vi.fn(), hash: vi.fn() },
}));

vi.mock("../../infrastructure/repositories/staff.repository.js", () => ({
  staffRepository: mocks.staffRepo,
}));
vi.mock("../../infrastructure/repositories/audit-log.repository.js", () => ({
  auditLogRepository: mocks.auditRepo,
}));
vi.mock("../../../restaurant/public.js", () => ({
  restaurantRepository: mocks.restaurantRepo,
}));
vi.mock("bcryptjs", () => ({ default: mocks.bcrypt }));

import { staffService } from "../../application/services/staff.service.js";

const RESTAURANT_ID = "restaurant_1";
const ACTOR_ID = "actor_1";

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: "staff_1",
    restaurantId: RESTAURANT_ID,
    fullName: "Krish Naik",
    email: "krish@example.com",
    role: "waiter",
    status: "active",
    employeeCode: "EMP-00001",
    firstName: "Krish",
    lastName: "Naik",
    phone: "9876543210",
    joinedAt: new Date("2024-01-01T00:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

const validInput = {
  first_name: "Krish",
  last_name: "Naik",
  email: "KRISH@example.com",
  phone: "9876543210",
  password: "secret123",
  role: "WAITER",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.restaurantRepo.findById.mockResolvedValue({ _id: RESTAURANT_ID });
  mocks.staffRepo.findByEmail.mockResolvedValue(null);
  mocks.staffRepo.findByPhone.mockResolvedValue(null);
  mocks.staffRepo.findLatestEmployeeCode.mockResolvedValue("EMP-00002");
  mocks.bcrypt.genSalt.mockResolvedValue("salt");
  mocks.bcrypt.hash.mockResolvedValue("hashed");
  mocks.auditRepo.create.mockResolvedValue({ _id: "audit_1" });
});

describe("staffService.createStaff", () => {
  it("creates a staff member with auto-generated sequential employee code (BR-005)", async () => {
    mocks.staffRepo.create.mockResolvedValue(makeUser({ employeeCode: "EMP-00003", role: "cook" }));

    const result = await staffService.createStaff(RESTAURANT_ID, ACTOR_ID, "restaurant_owner", {
      ...validInput,
      role: "CHEF",
    });

    expect(result.employee_code).toBe("EMP-00003");
    expect(result.first_name).toBe("Krish");
    expect(result.role).toBe("cook");
    expect(mocks.staffRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: RESTAURANT_ID,
        employeeCode: "EMP-00003",
        email: "krish@example.com",
        role: "cook",
        createdBy: ACTOR_ID,
      }),
    );
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "STAFF_CREATED",
        restaurantId: RESTAURANT_ID,
        actorId: ACTOR_ID,
        actorRole: "restaurant_owner",
        entityId: "staff_1",
      }),
    );
  });

  it("rejects duplicate email within the same restaurant (BR-003)", async () => {
    mocks.staffRepo.findByEmail.mockResolvedValue(makeUser());

    await expect(
      staffService.createStaff(RESTAURANT_ID, ACTOR_ID, "restaurant_owner", validInput),
    ).rejects.toMatchObject({ code: "EMAIL_ALREADY_EXISTS" });
    expect(mocks.staffRepo.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate phone within the same restaurant (BR-004)", async () => {
    mocks.staffRepo.findByPhone.mockResolvedValue(makeUser());

    await expect(
      staffService.createStaff(RESTAURANT_ID, ACTOR_ID, "restaurant_owner", validInput),
    ).rejects.toMatchObject({ code: "PHONE_ALREADY_EXISTS" });
    expect(mocks.staffRepo.create).not.toHaveBeenCalled();
  });

  it("requires an existing restaurant (BR-010)", async () => {
    mocks.restaurantRepo.findById.mockResolvedValue(null);

    await expect(
      staffService.createStaff(RESTAURANT_ID, ACTOR_ID, "restaurant_owner", validInput),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
  });

  it("rejects an invalid role", async () => {
    await expect(
      staffService.createStaff(RESTAURANT_ID, ACTOR_ID, "restaurant_owner", {
        ...validInput,
        role: "GENERAL_MANAGER",
      }),
    ).rejects.toMatchObject({ code: "INVALID_ROLE" });
  });
});

describe("staffService.listStaff", () => {
  it("normalises filters and returns pagination meta", async () => {
    mocks.staffRepo.list.mockResolvedValue({ data: [makeUser()], total: 1 });

    const result = await staffService.listStaff(RESTAURANT_ID, {
      page: 1,
      limit: 10,
      search: "krish",
      role: "CHEF",
      status: "ACTIVE",
    });

    expect(mocks.staffRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: RESTAURANT_ID,
        search: "krish",
        role: "cook",
        status: "active",
        limit: 10,
        skip: 0,
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.employee_code).toBe("EMP-00001");
    expect(result.meta).toMatchObject({ page: 1, total: 1, has_next: false });
  });

  it("caps the page limit at 100", async () => {
    mocks.staffRepo.list.mockResolvedValue({ data: [], total: 0 });

    await staffService.listStaff(RESTAURANT_ID, { limit: 999 });

    expect(mocks.staffRepo.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });
});

describe("staffService.updateStaff", () => {
  it("detects a role change and writes STAFF_ROLE_CHANGED audit (BR-009)", async () => {
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ role: "waiter" }));
    mocks.staffRepo.updateById.mockResolvedValue(makeUser({ role: "cook" }));

    const result = await staffService.updateStaff(
      "staff_1",
      RESTAURANT_ID,
      ACTOR_ID,
      "restaurant_owner",
      { role: "CHEF" },
    );

    expect(result.role).toBe("cook");
    expect(mocks.staffRepo.updateById).toHaveBeenCalledWith(
      "staff_1",
      RESTAURANT_ID,
      expect.objectContaining({ role: "cook", updatedBy: ACTOR_ID }),
    );
    const actions = mocks.auditRepo.create.mock.calls.map((c) => c[0]!.action);
    expect(actions).toContain("STAFF_UPDATED");
    expect(actions).toContain("STAFF_ROLE_CHANGED");
  });

  it("rejects a phone number already used by another staff member (BR-004)", async () => {
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ phone: "1111111111" }));
    mocks.staffRepo.findByPhone.mockResolvedValue(
      makeUser({ _id: "staff_2", phone: "2222222222" }),
    );

    await expect(
      staffService.updateStaff("staff_1", RESTAURANT_ID, ACTOR_ID, "restaurant_owner", {
        phone: "2222222222",
      }),
    ).rejects.toMatchObject({ code: "PHONE_ALREADY_EXISTS" });
  });

  it("throws STAFF_NOT_FOUND for an unknown staff member", async () => {
    mocks.staffRepo.findById.mockResolvedValue(null);

    await expect(
      staffService.updateStaff("missing", RESTAURANT_ID, ACTOR_ID, "restaurant_owner", {
        first_name: "New",
      }),
    ).rejects.toMatchObject({ code: "STAFF_NOT_FOUND" });
  });
});

describe("staffService.updateStaffStatus", () => {
  it("deactivates staff and writes STAFF_DEACTIVATED audit", async () => {
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ status: "active" }));
    mocks.staffRepo.updateById.mockResolvedValue(makeUser({ status: "suspended" }));

    const result = await staffService.updateStaffStatus(
      "staff_1",
      RESTAURANT_ID,
      ACTOR_ID,
      "restaurant_admin",
      { status: "SUSPENDED", reason_text: "Violation of policy" },
    );

    expect(result.status).toBe("suspended");
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "STAFF_DEACTIVATED",
        reasonText: "Violation of policy",
      }),
    );
  });

  it("reactivates staff and writes STAFF_REACTIVATED audit", async () => {
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ status: "suspended" }));
    mocks.staffRepo.updateById.mockResolvedValue(makeUser({ status: "active" }));

    const result = await staffService.updateStaffStatus(
      "staff_1",
      RESTAURANT_ID,
      ACTOR_ID,
      "restaurant_owner",
      { status: "ACTIVE" },
    );

    expect(result.status).toBe("active");
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "STAFF_REACTIVATED" }),
    );
  });

  it("prevents a user from changing their own status", async () => {
    await expect(
      staffService.updateStaffStatus("staff_1", RESTAURANT_ID, "staff_1", "restaurant_owner", {
        status: "INACTIVE",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
});

describe("staffService.deleteStaff", () => {
  it("soft deletes a staff member (BR-006) and writes audit", async () => {
    mocks.staffRepo.findById.mockResolvedValue(makeUser());
    mocks.staffRepo.softDelete.mockResolvedValue(
      makeUser({ status: "inactive", deletedAt: new Date() }),
    );

    const result = await staffService.deleteStaff(
      "staff_1",
      RESTAURANT_ID,
      ACTOR_ID,
      "restaurant_owner",
    );

    expect(mocks.staffRepo.softDelete).toHaveBeenCalledWith("staff_1", RESTAURANT_ID, ACTOR_ID);
    expect(result.status).toBe("inactive");
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "STAFF_DEACTIVATED" }),
    );
  });

  it("prevents deleting a restaurant owner", async () => {
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ role: "restaurant_owner" }));

    await expect(
      staffService.deleteStaff("staff_1", RESTAURANT_ID, ACTOR_ID, "restaurant_owner"),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    expect(mocks.staffRepo.softDelete).not.toHaveBeenCalled();
  });

  it("prevents deleting your own account", async () => {
    await expect(
      staffService.deleteStaff("staff_1", RESTAURANT_ID, "staff_1", "restaurant_owner"),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
});

describe("staffService.getStaffById / getMyProfile", () => {
  it("throws STAFF_NOT_FOUND when staff does not exist", async () => {
    mocks.staffRepo.findById.mockResolvedValue(null);

    await expect(staffService.getStaffById("missing", RESTAURANT_ID)).rejects.toMatchObject({
      code: "STAFF_NOT_FOUND",
    });
  });

  it("returns own profile for waiter/chef self-view", async () => {
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ _id: "staff_me" }));

    const result = await staffService.getMyProfile("staff_me", RESTAURANT_ID);

    expect(result.id).toBe("staff_me");
    expect(mocks.staffRepo.findById).toHaveBeenCalledWith("staff_me", RESTAURANT_ID);
  });
});
