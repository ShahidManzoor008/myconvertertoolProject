import PropTypes from 'prop-types';

export default function AIArticleSources({ ai }) {
  if (!ai?.generationId) return null;
  return <section aria-label="Article sources" className="mt-8 space-y-4 border-t border-slate-200 pt-5 text-sm dark:border-slate-700"><p className="text-slate-500">This article was created with AI assistance using official publisher sources. Check the original sources for the latest details.</p>{!!ai.sources?.length && <><h2 className="font-semibold">Sources</h2><ul className="space-y-2">{ai.sources.map(source => <li key={source.url}><a className="break-words text-blue-700 underline dark:text-blue-300" href={source.url} rel="noopener noreferrer">{source.title}</a></li>)}</ul></>}</section>;
}
AIArticleSources.propTypes = { ai: PropTypes.shape({ generationId: PropTypes.string, sources: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string.isRequired, title: PropTypes.string.isRequired })) }) };
