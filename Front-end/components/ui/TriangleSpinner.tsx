import styles from "./TriangleSpinner.module.css";

const N = 6;
const M = 3;

export default function TriangleSpinner() {
  return (
    <div className={styles.spinnerHost}>
      <div
        className={styles.spinner}
        style={{ "--m": M } as React.CSSProperties}
      >
        {Array.from({ length: N }, (_, i) => (
          <div
            key={i}
            className={styles.tri}
            style={
              {
                "--k": i / N,
                "--s": i % 2 === 0 ? 1 : -1,
                "--delay": `${-(i / N) * 2}s`,
              } as React.CSSProperties
            }
          >
            {Array.from({ length: M }, (_, j) => (
              <div
                key={j}
                className={styles.layer}
                style={
                  {
                    "--c": j,
                    "--hue": (j / M) * 360,
                    "--oa": (j - (M - 1) / 2) * 5,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}