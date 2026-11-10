// Explicit entry for all global styles.
// Fix for https://github.com/saicaca/fuwari/issues/775 :
// previously these files were only loaded as a side effect of
// `import.meta.glob("../../**")` in ImageWrapper.astro, which made the
// loading order nondeterministic and could break the build
// (e.g. `The 'link' class does not exist` in markdown.css).
import "./variables.styl";
import "./main.css";
import "./markdown.css";
import "./markdown-extend.styl";
import "./transition.css";
import "./scrollbar.css";
import "./expressive-code.css";
import "./photoswipe.css";
