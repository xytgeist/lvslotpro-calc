-- Market Edge: disable all SEC EDGAR filing feeds (general wire, not filing ticker).

update public.lounge_news_sources
set enabled = false
where kind = 'edgar';
