import Handlebars from 'handlebars';

/**
 * Compiles a template string with data.
 */
const compileString = (templateString, data) => {
  if (!templateString) return '';
  const template = Handlebars.compile(templateString);
  return template(data);
};

/**
 * Prepares the full email object.
 */
const compileEmail = (templateDoc, data) => {
  return {
    subject: compileString(templateDoc.subject, data),
    html: compileString(templateDoc.bodyHtml, data),
    text: compileString(templateDoc.bodyText || '', data),
  };
};

export { compileEmail, compileString };
