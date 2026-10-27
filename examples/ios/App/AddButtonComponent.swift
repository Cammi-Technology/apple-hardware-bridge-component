import HotwireNative
import UIKit

/// The page's add action, as a prominent "+" item in the bottom toolbar,
/// like the one in Reminders. A page asks for it with the
/// `bridge--add-button` controller.
///
/// If the page lists items, tapping it opens a native menu of them, and
/// the chosen item's id goes back to the page. With no items, a tap tells
/// the page, which clicks its own HTML add button.
///
/// It is a standard toolbar item, so the system places it. On the iPhone
/// Duo, bottom toolbar items move to the bottom of the vertical bar, the
/// side column that also holds the status bar and the Dynamic Island.
/// Elsewhere it sits in the toolbar at the bottom.
final class AddButtonComponent: BridgeComponent {
    override nonisolated class var name: String { "add-button" }

    private var item: UIBarButtonItem?

    private var host: UIViewController? {
        delegate?.destination as? UIViewController
    }

    override func onReceive(message: Message) {
        switch message.event {
        case "connect": show(message.data(as: MessageData.self))
        case "disconnect": remove()
        default: break
        }
    }

    override func onViewDidAppear() {
        if item != nil { host?.navigationController?.setToolbarHidden(false, animated: false) }
    }

    override func onViewWillDisappear() {
        if item != nil { host?.navigationController?.setToolbarHidden(true, animated: false) }
    }

    private func show(_ data: MessageData?) {
        guard item == nil, let host else { return }

        let image = UIImage(systemName: "plus")
        let item: UIBarButtonItem
        let items = data?.items ?? []
        if items.isEmpty {
            item = UIBarButtonItem(image: image, primaryAction: UIAction { [weak self] _ in
                self?.reply(to: "connect")
            })
        } else {
            item = UIBarButtonItem(image: image, menu: UIMenu(children: items.map { choice in
                UIAction(title: choice.title, image: choice.image.flatMap { UIImage(systemName: $0) }) { [weak self] _ in
                    self?.reply(to: "connect", with: Selection(id: choice.id))
                }
            }))
        }
        item.accessibilityLabel = data?.title ?? "Add"
        if #available(iOS 26.0, *) {
            item.style = .prominent
        }

        host.toolbarItems = [.flexibleSpace(), item]
        host.navigationController?.setToolbarHidden(false, animated: false)
        self.item = item
    }

    private func remove() {
        guard item != nil else { return }
        host?.toolbarItems = nil
        host?.navigationController?.setToolbarHidden(true, animated: false)
        item = nil
    }
}

private extension AddButtonComponent {
    struct MessageData: Decodable {
        let title: String?
        let items: [Item]?
    }

    struct Item: Decodable {
        let id: String
        let title: String
        let image: String?
    }

    struct Selection: Encodable {
        let id: String
    }
}

private extension Message {
    func data<T: Decodable>(as type: T.Type) -> T? { data() }
}
