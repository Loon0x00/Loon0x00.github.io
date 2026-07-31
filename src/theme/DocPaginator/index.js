import React from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import PaginatorNavLink from '@theme/PaginatorNavLink';

const ENGLISH_CATEGORY_LABELS = {
  节点: 'Nodes',
  规则: 'Rules',
  策略: 'Policies',
  复写: 'Rewrite',
  脚本: 'Scripts',
  插件: 'Plugins',
  其他配置: 'General',
};

export default function DocPaginator({previous, next}) {
  const {i18n} = useDocusaurusContext();
  const localizeItem = (item) => {
    if (!item || i18n.currentLocale !== 'en') {
      return item;
    }
    return {
      ...item,
      title: ENGLISH_CATEGORY_LABELS[item.title] ?? item.title,
    };
  };

  const localizedPrevious = localizeItem(previous);
  const localizedNext = localizeItem(next);

  return (
    <nav
      className="pagination-nav docusaurus-mt-lg"
      aria-label={translate({
        id: 'theme.docs.paginator.navAriaLabel',
        message: 'Docs pages',
        description: 'The ARIA label for the docs pagination',
      })}>
      {localizedPrevious && (
        <PaginatorNavLink
          {...localizedPrevious}
          subLabel={
            <Translate
              id="theme.docs.paginator.previous"
              description="The label used to navigate to the previous doc">
              Previous
            </Translate>
          }
        />
      )}
      {localizedNext && (
        <PaginatorNavLink
          {...localizedNext}
          subLabel={
            <Translate
              id="theme.docs.paginator.next"
              description="The label used to navigate to the next doc">
              Next
            </Translate>
          }
          isNext
        />
      )}
    </nav>
  );
}
