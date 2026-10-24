import { Baby, Bone, Brain, Droplets, Ear, Eye, Hand, HandHeart, HeartPulse, Smile, Stethoscope, Utensils, Venus, Wind } from "lucide-react";
import type { CareArea } from "@/types/care";

export const careAreas: CareArea[] = [
  { icon: HeartPulse, name: "Heart & chest", specialty: "Cardiology", urgent: true },
  { icon: Brain, name: "Brain & nerves", specialty: "Neurology", urgent: true },
  { icon: Wind, name: "Breathing & lungs", specialty: "Pulmonology", urgent: true },
  { icon: Venus, name: "Pregnancy & women", specialty: "Gynecology", urgent: true },
  { icon: Bone, name: "Bones & injury", specialty: "Orthopedics", urgent: true },
  { icon: Stethoscope, name: "General care", specialty: "General Medicine" },
  { icon: Baby, name: "Children", specialty: "Pediatrics" },
  { icon: Utensils, name: "Stomach & liver", specialty: "Gastroenterology" },
  { icon: Droplets, name: "Kidneys & urinary", specialty: "Nephrology" },
  { icon: HandHeart, name: "Mind & mood", specialty: "Psychiatry" },
  { icon: Eye, name: "Eyes", specialty: "Ophthalmology" },
  { icon: Ear, name: "Ear, nose & throat", specialty: "ENT" },
  { icon: Hand, name: "Skin", specialty: "Dermatology" },
  { icon: Smile, name: "Dental", specialty: "Dentistry" },
];

/** Fixed example locations for the dispatch simulation. These are not reported incidents. */
export const scenarios = [
  { title: "Proddatur Bypass · NH-40", level: "Critical", lat: 14.7504, lon: 78.5482 },
  { title: "Yerraguntla Junction · NH-716", level: "Moderate", lat: 14.6338, lon: 78.5395 },
  { title: "Chennur Bridge · NH-40", level: "Major", lat: 14.4734, lon: 78.8078 },
];

export const emergencyNumbers = [
  { number: "112", label: "All emergencies", detail: "Emergency Response Support System: police, fire and ambulance." },
  { number: "108", label: "Medical ambulance", detail: "Emergency ambulance service in most states and UTs." },
  { number: "102", label: "Mother & child transport", detail: "Ambulance for pregnant women and infants." },
  { number: "104", label: "Health helpline", detail: "Medical advice and information." },
  { number: "14416", label: "Tele-MANAS", detail: "Free 24×7 mental health support." },
];

export const redFlags = [
  "Chest pain, pressure or tightness, especially with sweating or breathlessness",
  "Face drooping, arm weakness or slurred speech. Note the time it started",
  "Severe difficulty breathing, or blue or grey lips",
  "Heavy bleeding, a serious injury, or a road accident",
  "Fainting, a seizure, or sudden confusion",
  "In pregnancy: heavy bleeding, severe abdominal pain, or fits",
];

export const visitChecklist = [
  { id: "photo-id", label: "Photo ID", detail: "Aadhaar card or any government photo ID." },
  { id: "abha", label: "ABHA number, if you have one", detail: "Your Ayushman Bharat Health Account links digital records." },
  { id: "scheme-card", label: "Scheme card", detail: "PM-JAY or Aarogyasri card if you are covered." },
  { id: "records", label: "Previous prescriptions & reports", detail: "Recent tests, scans and discharge summaries." },
  { id: "medicines", label: "Current medicines & allergies", detail: "Names and doses, or carry the strips." },
  { id: "contact", label: "Emergency contact", detail: "A family member's number, and someone to come with you if unwell." },
];

export const SAMPLE_FEE = 100;
