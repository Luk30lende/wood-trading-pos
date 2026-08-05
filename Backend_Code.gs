/**
 * =====================================================
 * Wood Trading POS
 * Backend Entry Point
 * =====================================================
 */

/**
 * Serves the application.
 */
function doGet() {
  return HtmlService.createTemplateFromFile("Frontend_Index")
    .evaluate()
    .setTitle("Wood Trading POS")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Includes HTML partials inside other HTML files.
 * Example:
 * <?!= include('Frontend_Styles'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
