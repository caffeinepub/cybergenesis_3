import React from "react";

export default function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "url('/assets/uploads/IMG_0509-1.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: "8vh",
        zIndex: 9999,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap');

        @keyframes spin-outer {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-inner {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        .loader-outer {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 7px dashed #E600E6;
          filter: drop-shadow(0 0 8px #E600E6);
          animation: spin-outer 4s linear infinite;
          flex-shrink: 0;
        }

        .loader-inner-wrap {
          position: absolute;
          width: 68px;
          height: 68px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .loader-inner {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 6px solid #00E6E6;
          filter: drop-shadow(0 0 8px #00E6E6);
          animation: spin-inner 2s linear infinite reverse;
        }
      `}</style>

      <div
        style={{
          maxWidth: "400px",
          width: "82vw",
          height: "auto",
          padding: "18px 36px",
          background: "rgba(255, 255, 255, 0.035)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          borderRadius: "22px",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.20)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {/* Double spinner */}
        <div
          style={{
            position: "relative",
            width: "96px",
            height: "96px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="loader-outer" />
          <div className="loader-inner-wrap">
            <div className="loader-inner" />
          </div>
        </div>

        {/* Text */}
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "1rem",
            fontWeight: 500,
            color: "#ffffff",
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            textShadow: "0 0 8px rgba(255,255,255,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          LOADING CYBERLAND METAVERSE
        </span>
      </div>
    </div>
  );
}
