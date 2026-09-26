// Image links
// Every image on the site gets its src from assets/data/media.json, so swapping
// a photo or the logo means editing that one file instead of every page.
//   <img data-media="logo">      takes media.logo's src and alt
//   <link rel="icon" data-media> takes the same src as its href
//   <div data-gallery>           gets one tile per entry in media.gallery
// It waits for copy.js, since the member cards it builds hold images too.

const MEDIA_URL = "assets/data/media.json";

function applyImage(el, entry) {
  if (el.tagName === "LINK") {
    el.href = entry.src;
    return;
  }

  el.src = entry.src;

  // A page-authored alt wins, so the same entry can be described per page.
  if (!el.hasAttribute("alt")) {
    el.alt = entry.alt || "";
  }
}

function galleryTile(photo, hidden) {
  const col = document.createElement("div");
  col.className = "col-6 col-md-4";
  col.hidden = hidden;

  const tile = document.createElement("div");
  tile.className = "media-tile";

  const img = document.createElement("img");
  img.src = photo.src;
  img.alt = photo.alt;
  img.loading = "lazy";
  img.decoding = "async";
  if (photo.width) {
    img.width = photo.width;
  }
  if (photo.height) {
    img.height = photo.height;
  }

  tile.appendChild(img);
  col.appendChild(tile);

  return col;
}

function renderGallery(grid, photos) {
  // Shows the first few, and a button reveals the rest.
  const preview = parseInt(grid.dataset.galleryPreview, 10) || photos.length;
  const more = grid.parentElement.querySelector("[data-gallery-more]");

  photos.forEach((photo, i) => {
    grid.appendChild(galleryTile(photo, i >= preview));
  });

  if (!more || photos.length <= preview) {
    return;
  }

  more.textContent = "Show all " + photos.length + " photos";
  more.hidden = false;
  more.addEventListener("click", () => {
    grid.querySelectorAll(".col-6[hidden]").forEach((col) => {
      col.hidden = false;
    });
    more.hidden = true;
  });
}

const mediaData = fetch(MEDIA_URL).then((response) => {
  if (!response.ok) {
    throw new Error(MEDIA_URL + " returned " + response.status);
  }
  return response.json();
});

Promise.all([mediaData, window.siteCopy])
  .then(([media]) => {
    document.querySelectorAll("[data-media]").forEach((el) => {
      const entry = media[el.dataset.media];
      if (entry) {
        applyImage(el, entry);
      } else {
        console.warn("media.json has no entry named", el.dataset.media);
      }
    });

    const grids = document.querySelectorAll("[data-gallery]");
    grids.forEach((grid) => {
      renderGallery(grid, media.gallery || []);
    });

    // The gallery arrives after the browser has already jumped to a #section
    // link, and it pushes everything below it down, so jump again.
    const target = grids.length && location.hash && document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView();
    }
  })
  .catch((error) => {
    console.error("Could not load images:", error);
  });
