# Changelog

## [Unreleased]
### Fixed
- Re-render chart on update and deletion of time entries (#22)
### Added
- Add release workflow to create release once tag is pushed

## [v1.8.3] - 2025-04-24
### Fixed
- Use color from company theme

## [v1.8.2] - 2024-06-28
### Fixed
- Fix extension after changes in the TimeChimp HTML structure.

## [v1.8.1] - 2024-02-28
### Added
- Add "Ouderschapsverlof" to leave tasks.

## [v1.8.0] - 2024-02-06
### Added
- Show billability percentage in chart.

## [v1.7.0] - 2024-02-03
### Added
- Add mode for viewing chart and stats relative to contract hours.
- Add loading indicator.

## [v1.6.0] - 2024-02-03
### Added
- Load theme color for billable section of the chart from company configuration.

## [v1.5.2] - 2024-01-04
### Fixed
- Fix week ordering between years.

## [v1.5.1] - 2023-11-10
### Added
- Add "Tijd voor tijd" to leave tasks.

## [v1.5.0] - 2023-11-10
### Fixed
- Exclude leave tasks ("Bijzonder verlof", "Feestdag", "Verlof") from billability calculation.
### Added
- Show leave hours in tooltip.

## [v1.4.0] - 2023-11-10
### Added
- Show actual hours next to billability percentages in tooltip.

## [v1.3.1] - 2023-11-10
### Fixed
- Fix chart breaking when changing page or switching time entries view.

## [v1.3.0] - 2023-11-10
### Fixed
- Improve setup and remove unnecessary permissions.
- Fix billability rolling average calculation.
- Fix chart not showing for non-admin users.

## [v1.2.0] - 2023-11-10
### Added
- Show total hours worked on the chart x-axis and in the tooltip.

## [v1.1.0] - 2023-11-10
### Added
- Refresh the chart when adding, editing, or deleting time entries.
- Update the chart with an animation instead of recreating it on changes.
### Fixed
- Fix some bugs with week switching and improve overall date handling.

## [v1.0.1] - 2023-11-10
### Fixed
- Fixed a unauthorized API call to break the chart for non-admin users.

## [v1.0.0] - 2023-11-10
### Added
Initial release! 📊
