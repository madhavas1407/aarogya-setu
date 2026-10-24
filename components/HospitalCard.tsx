import { Check, Clock, ExternalLink, Globe, Hospital as HospitalIcon, Info, LoaderCircle, MapPin, Navigation, Phone, Star } from "lucide-react";
import { formatCategory, formatDistance } from "@/lib/format";
import type { Hospital } from "@/types/hospital";

type Props = {
  hospital: Hospital;
  details?: Hospital;
  distance?: number;
  chosen: boolean;
  loadingDetails: boolean;
  onChoose: () => void;
  onLoadDetails: () => void;
};

export function HospitalCard({ hospital, details, distance, chosen, loadingDetails, onChoose, onLoadDetails }: Props) {
  const rating = details?.rating ?? hospital.rating;
  const reviews = details?.userRatingCount ?? hospital.userRatingCount;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospital.name)}&destination_place_id=${encodeURIComponent(hospital.id)}`;

  return (
    <article className={`hospital-card ${chosen ? "is-chosen" : ""}`} aria-label={hospital.name}>
      <div className="hospital-icon" aria-hidden="true"><HospitalIcon /></div>
      <div className="hospital-body">
        <div className="hospital-title">
          <h3>{hospital.name}</h3>
          {distance !== undefined && <span className="distance-tag"><Navigation aria-hidden="true" /> {formatDistance(distance)}</span>}
        </div>
        {hospital.category && <span className="tag">{formatCategory(hospital.category)}</span>}
        <p className="hospital-address"><MapPin aria-hidden="true" /> {hospital.address || "Address not provided"}</p>

        {rating !== undefined && (
          <p className="hospital-rating"><Star aria-hidden="true" /> <b>{rating.toFixed(1)}</b>{reviews ? ` · ${reviews.toLocaleString()} Google reviews` : ""}</p>
        )}

        <div className="hospital-links">
          {details?.phone && <a href={`tel:${details.phone.replace(/\s/g, "")}`}><Phone aria-hidden="true" /> {details.phone}</a>}
          {details?.website && <a href={details.website} target="_blank" rel="noreferrer"><Globe aria-hidden="true" /> Website</a>}
          <a href={directions} target="_blank" rel="noreferrer"><Navigation aria-hidden="true" /> Directions</a>
          {hospital.googleMapsUri && <a href={hospital.googleMapsUri} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Google Maps</a>}
        </div>

        {details?.openingHours && (
          <details className="hours">
            <summary><Clock aria-hidden="true" /> Opening hours</summary>
            <ul>{details.openingHours.map((day) => <li key={day}>{day}</li>)}</ul>
          </details>
        )}

        <div className="hospital-footer">
          <button type="button" className="link-btn" onClick={onLoadDetails} disabled={loadingDetails}>
            {loadingDetails ? <><LoaderCircle className="spin" aria-hidden="true" /> Loading details…</> : details ? "Refresh details" : "Load phone, website, rating & hours"}
          </button>
          <span className="hospital-note"><Info aria-hidden="true" /> Beds, doctors and appointment slots are not supplied by Google Places.</span>
        </div>
      </div>
      <button type="button" className={`btn btn-sm ${chosen ? "btn-success" : "btn-secondary"} hospital-select`} onClick={onChoose} aria-pressed={chosen}>
        {chosen ? <><Check aria-hidden="true" /> Selected</> : "Select"}
      </button>
    </article>
  );
}
