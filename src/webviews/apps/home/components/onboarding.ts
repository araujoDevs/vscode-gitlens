import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';
import { Commands } from '../../../../constants.commands';
import { createCommandLink } from '../../../../system/commands';
import type { State } from '../../../home/protocol';
import { CollapseSectionCommand, DismissWalkthroughSection } from '../../../home/protocol';
import { ipcContext } from '../../shared/context';
import type { HostIpc } from '../../shared/ipc';
import { stateContext } from '../context';
import { alertStyles, buttonStyles, homeBaseStyles, walkthroughProgressStyles } from '../home.css';
import '../../shared/components/button';
import '../../shared/components/code-icon';
import '../../shared/components/overlays/tooltip';

@customElement('gl-onboarding')
export class GlOnboarding extends LitElement {
	static override styles = [alertStyles, homeBaseStyles, buttonStyles, walkthroughProgressStyles];

	@consume<State>({ context: stateContext, subscribe: true })
	@state()
	private _state!: State;

	@consume<HostIpc>({ context: ipcContext, subscribe: true })
	@state()
	private _ipc!: HostIpc;

	private onSectionExpandClicked(e: MouseEvent, isToggle = false) {
		if (isToggle) {
			e.stopImmediatePropagation();
		}
		const target = (e.target as HTMLElement).closest('[data-section-expand]') as HTMLElement;
		const section = target?.dataset.sectionExpand;
		if (section !== 'walkthrough') {
			return;
		}

		if (isToggle) {
			this.updateCollapsedSections(!this._state.walkthroughCollapsed);
			return;
		}

		this.updateCollapsedSections(false);
	}

	private updateCollapsedSections(toggle = this._state.walkthroughCollapsed) {
		this._state.walkthroughCollapsed = toggle;
		this.requestUpdate();
		this._ipc.sendCommand(CollapseSectionCommand, {
			section: 'walkthrough',
			collapsed: toggle,
		});
	}

	private dismissWalkthroughSection() {
		this._state.showWalkthroughProgress = false;
		this.requestUpdate();
		this._ipc.sendCommand(DismissWalkthroughSection);
	}

	private renderProgress() {
		if (!this._state.showWalkthroughProgress) {
			return null;
		}
		return html`
			<div class="walkthrough-progress--wrapper">
				<div class="walkthrough-progress--title">
					<span
						>GitLens Walkthrough
						(${this._state.walkthroughProgress.doneCount}/${this._state.walkthroughProgress.allCount})</span
					>
					<div>
						<gl-button
							href=${createCommandLink(Commands.OpenWalkthrough, {})}
							class="walkthrough-progress--title__button"
							appearance="toolbar"
							><code-icon icon="play"></code-icon
						></gl-button>
						<gl-button
							@click=${this.dismissWalkthroughSection.bind(this)}
							class="walkthrough-progress--title__button"
							appearance="toolbar"
							><code-icon icon="x"></code-icon
						></gl-button>
					</div>
				</div>
				<progress
					class=${classMap({
						'walkthrough-progress--progress': true,
					})}
					value=${this._state.walkthroughProgress.progress}
				></progress>
			</div>
		`;
	}

	override render() {
		return html`
			${this.renderProgress()}
			<div
				id="section-walkthrough"
				data-section-expand="walkthrough"
				class="alert${this._state.walkthroughCollapsed ? ' is-collapsed' : ''}"
				@click=${(e: MouseEvent) => this.onSectionExpandClicked(e)}
			>
				<h1 class="alert__title">Get Started with GitLens</h1>
				<div class="alert__description">
					<p>Explore all of the powerful features in GitLens</p>
					<p class="button-container button-container--trio">
						<gl-button
							appearance="secondary"
							full
							href="command:gitlens.showWelcomePage"
							aria-label="Open Welcome"
							>Start Here (Welcome)</gl-button
						>
						<span class="button-group button-group--single">
							<gl-button appearance="secondary" full href="command:gitlens.getStarted?%22home%22"
								>Walkthrough
								${when(
									this._state.showWalkthroughProgress && this._state.walkthroughProgress.progress < 1,
									() => html`<span class="badge"></span>`,
								)}</gl-button
							>
							<gl-button
								appearance="secondary"
								full
								href=${'https://youtu.be/oJdlGtsbc3U?utm_source=inapp&utm_medium=home_banner&utm_id=GitLens+tutorial'}
								aria-label="Watch the GitLens Tutorial video"
								tooltip="Watch the GitLens Tutorial video"
								><code-icon icon="vm-running" slot="prefix"></code-icon>Tutorial</gl-button
							>
						</span>
					</p>
				</div>
				<a
					href="#"
					class="alert__close"
					data-section-toggle="walkthrough"
					@click=${(e: MouseEvent) => this.onSectionExpandClicked(e, true)}
				>
					<gl-tooltip hoist>
						<code-icon icon="chevron-down" aria-label="Collapse walkthrough section"></code-icon>
						<span slot="content">Collapse</span>
					</gl-tooltip>
					<gl-tooltip hoist>
						<code-icon icon="chevron-right" aria-label="Expand walkthrough section"></code-icon>
						<span slot="content">Expand</span>
					</gl-tooltip>
				</a>
			</div>
		`;
	}
}
