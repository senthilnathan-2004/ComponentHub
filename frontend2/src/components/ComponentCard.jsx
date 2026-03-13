import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";

const ComponentCard = ({ component = {} }) => {
  // safe helpers
  const safeString = (v, fallback = "") =>
    typeof v === "string" ? v : fallback;

  const formatPrice = (price = 0) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price || 0));

  const renderStars = (rating = 0) => {
    const stars = [];
    // coerce rating to number between 0 and 5
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const fullStars = Math.floor(r);
    const hasHalfStar = r - fullStars >= 0.5;

    for (let i = 0; i < fullStars; i++)
      stars.push(
        <span key={`full-${i}`} className="star">
          ★
        </span>
      );
    if (hasHalfStar)
      stars.push(
        <span key="half" className="star">
          ☆
        </span>
      );

    const emptyStars = 5 - Math.ceil(r);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} style={{ color: "var(--color-fg-muted)" }}>
          ☆
        </span>
      );
    }
    return stars;
  };

  // safe accessors for seller
  const seller = component?.seller || null;
  const sellerName = safeString(seller?.name, "Unknown");
  const sellerInitial = sellerName ? sellerName.charAt(0).toUpperCase() : "U";

  // safe title/description
  const title = safeString(component.title, "Untitled");
  const description = safeString(component.description, "");

  return (
    <div
      className="component-card"
      style={{ backgroundColor: "var(--color-canvas-subtle)" }}
    >
      <div style={{ position: "relative" }}>
        <Link to={`/components/${component.id}`}>
          <img
            src={
              component.screenshots?.[0] ||
              "/placeholder.svg?height=200&width=300&query=component+preview"
            }
            alt={title}
            className="component-image"
          />
        </Link>
        
        {/* Favorite Button - Top Right Corner */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
          }}
        >
          <FavoriteButton componentId={component.id} />
        </div>
      </div>

      <div className="card-content">
        <h3 className="mb-2">
          <Link
            to={`/components/${component.id}`}
            style={{ color: "var(--color-fg-default)" }}
          >
            {title.charAt(0).toUpperCase() + title.slice(1)}
          </Link>
        </h3>

        <p
          className="mb-3"
          style={{ color: "var(--color-fg-muted)", fontSize: "14px" }}
        >
          {description.length > 100
            ? `${description.substring(0, 100)}...`
            : description}
        </p>

        <div className="d-flex align-items-center mb-2">
          <Link
            to={seller ? `/seller/${seller.id}` : "#"}
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <div
              className="avatar"
              style={{
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                marginRight: "8px",
                backgroundColor: "var(--color-border-default)",
                color: "var(--color-fg-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {sellerInitial}
            </div>
            <span style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}>
              {sellerName}
            </span>
          </Link>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="rating">
            {renderStars(component.rating)}
            <span
              style={{
                marginLeft: "8px",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              ({Number(component.reviewCount || 0)})
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            {Number(component.downloads || 0)} downloads
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <div className="price-tag">{formatPrice(component.price)}</div>
          <div>
            {Array.isArray(component.tags) &&
              component.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;
