import { Types } from "mongoose";
import {
  appointmentFilterForActor,
  canCreateAppointment,
  canTransitionAppointment,
  canTransitionInvoice,
  invoiceFilterForActor,
  normaliseInvoiceLineItems,
  parseDuration,
  parseFutureDate,
  validAppointmentStatus,
} from "../../controllers/OperationsController";

describe("operations authorization and validation", () => {
  const patient = new Types.ObjectId();
  const hospital = new Types.ObjectId();

  it("only permits patients and doctors to create appointments", () => {
    expect(canCreateAppointment("Patient")).toBe(true);
    expect(canCreateAppointment("Doctor")).toBe(true);
    expect(canCreateAppointment("Hospital")).toBe(false);
    expect(canCreateAppointment("Admin")).toBe(false);
  });

  it("scopes appointment viewing to the authenticated organization", () => {
    expect(appointmentFilterForActor("Hospital", hospital)).toEqual({ hospitalUserId: hospital });
    expect(appointmentFilterForActor("Patient", patient)).toEqual({ patientUserId: patient });
    expect(appointmentFilterForActor("Admin", patient)).not.toEqual({});
  });

  it("does not allow invoice ownership to cross hospitals", () => {
    expect(invoiceFilterForActor("Hospital", hospital)).toEqual({ hospitalUserId: hospital });
    expect(invoiceFilterForActor("Patient", patient)).toEqual({ patientUserId: patient });
    expect(invoiceFilterForActor("Admin", hospital)).not.toEqual({ hospitalUserId: hospital });
  });

  it("rejects invalid appointment dates, durations and statuses", () => {
    expect(parseFutureDate("not-a-date")).toBeUndefined();
    expect(parseFutureDate(new Date(Date.now() - 1_000))).toBeUndefined();
    expect(parseDuration(14)).toBeUndefined();
    expect(parseDuration(241)).toBeUndefined();
    expect(parseDuration(30)).toBe(30);
    expect(validAppointmentStatus("requested")).toBe(true);
    expect(validAppointmentStatus("paid")).toBe(false);
  });

  it("restricts appointment status changes to authorized participants", () => {
    expect(canTransitionAppointment("Patient", "requested", "confirmed")).toBe(false);
    expect(canTransitionAppointment("Doctor", "requested", "confirmed")).toBe(true);
    expect(canTransitionAppointment("Hospital", "confirmed", "completed")).toBe(true);
    expect(canTransitionAppointment("Admin", "confirmed", "cancelled")).toBe(false);
  });

  it("restricts invoice status changes to the owning hospital", () => {
    expect(canTransitionInvoice("Patient", "issued", "paid")).toBe(false);
    expect(canTransitionInvoice("Hospital", "issued", "paid")).toBe(true);
    expect(canTransitionInvoice("Hospital", "paid", "void")).toBe(false);
  });

  it("validates invoice line item amounts and rejects invalid values", () => {
    expect(normaliseInvoiceLineItems({
      lineItems: [{ description: "Consultation", quantity: 2, unitAmountMinor: 1250 }],
    })).toEqual({
      items: [{ description: "Consultation", quantity: 2, unitAmountMinor: 1250, totalAmountMinor: 2500 }],
      total: 2500,
    });
    expect(normaliseInvoiceLineItems({
      lineItems: [{ description: "Invalid", quantity: 0, unitAmountMinor: 100 }],
    })).toBeUndefined();
    expect(normaliseInvoiceLineItems({ description: "Legacy", amountMinor: -1 })).toBeUndefined();
  });
});
